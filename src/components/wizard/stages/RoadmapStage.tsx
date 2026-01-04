/**
 * RoadmapStage - Stage 2 of the Project Wizard
 * Plan sections and data model (entities)
 */

import { useState } from 'react';
import {
  Map,
  Plus,
  X,
  Loader2,
  Layers,
  Database,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Link2,
  Type,
} from 'lucide-react';
import type { RoadmapStageInput, StageOutput } from '../../../types/wizard';

interface Section {
  name: string;
  description: string;
  dependencies: string[];
}

interface EntityField {
  name: string;
  type: string;
}

interface Entity {
  name: string;
  fields: EntityField[];
  relationships: string[];
}

interface RoadmapStageProps {
  projectId: string;
  initialData?: Partial<RoadmapStageInput>;
  lastOutput?: StageOutput;
  isProcessing: boolean;
  onSubmit: (data: RoadmapStageInput) => Promise<StageOutput | undefined>;
}

const FIELD_TYPES = [
  'string',
  'number',
  'boolean',
  'date',
  'datetime',
  'uuid',
  'json',
  'array',
  'text',
  'email',
  'url',
];

// Section Editor Component
function SectionEditor({
  section,
  index,
  allSections,
  onChange,
  onRemove,
  disabled,
}: {
  section: Section;
  index: number;
  allSections: Section[];
  onChange: (section: Section) => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const otherSections = allSections.filter((_, i) => i !== index);

  const toggleDependency = (depName: string) => {
    const deps = section.dependencies.includes(depName)
      ? section.dependencies.filter((d) => d !== depName)
      : [...section.dependencies, depName];
    onChange({ ...section, dependencies: deps });
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-800/80"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <Layers className="text-cyan-400" size={18} />
          <span className="font-medium text-slate-200">
            {section.name || `Section ${index + 1}`}
          </span>
          {section.dependencies.length > 0 && (
            <span className="text-xs text-slate-500">
              ({section.dependencies.length} dependencies)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-1 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400"
            >
              <X size={16} />
            </button>
          )}
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {expanded && (
        <div className="p-4 pt-0 space-y-4 border-t border-slate-700">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Section Name
            </label>
            <input
              type="text"
              value={section.name}
              onChange={(e) => onChange({ ...section, name: e.target.value })}
              placeholder="e.g., User Authentication"
              disabled={disabled}
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Description
            </label>
            <textarea
              value={section.description}
              onChange={(e) =>
                onChange({ ...section, description: e.target.value })
              }
              placeholder="What this section does..."
              disabled={disabled}
              rows={2}
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 resize-none disabled:opacity-50"
            />
          </div>

          {otherSections.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">
                Dependencies (sections this depends on)
              </label>
              <div className="flex flex-wrap gap-2">
                {otherSections.map((other) => (
                  <button
                    key={other.name}
                    type="button"
                    onClick={() => toggleDependency(other.name)}
                    disabled={disabled || !other.name}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      section.dependencies.includes(other.name)
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                    } disabled:opacity-50`}
                  >
                    {other.name || 'Unnamed'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Entity Editor Component
function EntityEditor({
  entity,
  index,
  allEntities,
  onChange,
  onRemove,
  disabled,
}: {
  entity: Entity;
  index: number;
  allEntities: Entity[];
  onChange: (entity: Entity) => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('string');
  const otherEntities = allEntities.filter((_, i) => i !== index);

  const addField = () => {
    if (newFieldName.trim()) {
      onChange({
        ...entity,
        fields: [...entity.fields, { name: newFieldName.trim(), type: newFieldType }],
      });
      setNewFieldName('');
      setNewFieldType('string');
    }
  };

  const removeField = (fieldIndex: number) => {
    onChange({
      ...entity,
      fields: entity.fields.filter((_, i) => i !== fieldIndex),
    });
  };

  const toggleRelationship = (entityName: string) => {
    const rels = entity.relationships.includes(entityName)
      ? entity.relationships.filter((r) => r !== entityName)
      : [...entity.relationships, entityName];
    onChange({ ...entity, relationships: rels });
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-800/80"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <Database className="text-purple-400" size={18} />
          <span className="font-medium text-slate-200">
            {entity.name || `Entity ${index + 1}`}
          </span>
          <span className="text-xs text-slate-500">
            ({entity.fields.length} fields)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-1 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400"
            >
              <X size={16} />
            </button>
          )}
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {expanded && (
        <div className="p-4 pt-0 space-y-4 border-t border-slate-700">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Entity Name
            </label>
            <input
              type="text"
              value={entity.name}
              onChange={(e) => onChange({ ...entity, name: e.target.value })}
              placeholder="e.g., User, Project, Task"
              disabled={disabled}
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
            />
          </div>

          {/* Fields */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2">
              Fields
            </label>
            {entity.fields.length > 0 && (
              <div className="space-y-2 mb-3">
                {entity.fields.map((field, fieldIndex) => (
                  <div
                    key={fieldIndex}
                    className="flex items-center gap-2 bg-slate-900 rounded px-3 py-2"
                  >
                    <Type size={14} className="text-slate-500" />
                    <span className="text-sm text-slate-200 flex-1">
                      {field.name}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">
                      {field.type}
                    </span>
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => removeField(fieldIndex)}
                        className="p-1 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!disabled && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder="Field name"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addField())}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {FIELD_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addField}
                  disabled={!newFieldName.trim()}
                  className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-50"
                >
                  <Plus size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Relationships */}
          {otherEntities.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">
                <Link2 size={12} className="inline mr-1" />
                Relationships (entities this relates to)
              </label>
              <div className="flex flex-wrap gap-2">
                {otherEntities.map((other) => (
                  <button
                    key={other.name}
                    type="button"
                    onClick={() => toggleRelationship(other.name)}
                    disabled={disabled || !other.name}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      entity.relationships.includes(other.name)
                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                    } disabled:opacity-50`}
                  >
                    {other.name || 'Unnamed'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function RoadmapStage({
  initialData,
  lastOutput,
  isProcessing,
  onSubmit,
}: RoadmapStageProps) {
  const [sections, setSections] = useState<Section[]>(
    initialData?.sections?.map((s) => ({
      name: s.name,
      description: s.description,
      dependencies: s.dependencies || [],
    })) || []
  );

  const [entities, setEntities] = useState<Entity[]>(
    initialData?.entities?.map((e) => ({
      name: e.name,
      fields: e.fields || [],
      relationships: e.relationships || [],
    })) || []
  );

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const addSection = () => {
    setSections([...sections, { name: '', description: '', dependencies: [] }]);
  };

  const updateSection = (index: number, section: Section) => {
    setSections(sections.map((s, i) => (i === index ? section : s)));
    setValidationErrors([]);
  };

  const removeSection = (index: number) => {
    const removedName = sections[index].name;
    // Also remove from dependencies
    setSections(
      sections
        .filter((_, i) => i !== index)
        .map((s) => ({
          ...s,
          dependencies: s.dependencies.filter((d) => d !== removedName),
        }))
    );
  };

  const addEntity = () => {
    setEntities([...entities, { name: '', fields: [], relationships: [] }]);
  };

  const updateEntity = (index: number, entity: Entity) => {
    setEntities(entities.map((e, i) => (i === index ? entity : e)));
    setValidationErrors([]);
  };

  const removeEntity = (index: number) => {
    const removedName = entities[index].name;
    // Also remove from relationships
    setEntities(
      entities
        .filter((_, i) => i !== index)
        .map((e) => ({
          ...e,
          relationships: e.relationships.filter((r) => r !== removedName),
        }))
    );
  };

  const validate = (): boolean => {
    const errors: string[] = [];

    if (sections.length === 0) {
      errors.push('Add at least one section');
    }
    sections.forEach((s, i) => {
      if (!s.name.trim()) errors.push(`Section ${i + 1} needs a name`);
      if (!s.description.trim()) errors.push(`Section "${s.name || i + 1}" needs a description`);
    });

    if (entities.length === 0) {
      errors.push('Add at least one entity');
    }
    entities.forEach((e, i) => {
      if (!e.name.trim()) errors.push(`Entity ${i + 1} needs a name`);
      if (e.fields.length === 0) errors.push(`Entity "${e.name || i + 1}" needs at least one field`);
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data: RoadmapStageInput = {
      sections: sections.map((s) => ({
        name: s.name,
        description: s.description,
        dependencies: s.dependencies.length > 0 ? s.dependencies : undefined,
      })),
      entities: entities.map((ent) => ({
        name: ent.name,
        fields: ent.fields.length > 0 ? ent.fields : undefined,
        relationships: ent.relationships.length > 0 ? ent.relationships : undefined,
      })),
    };

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Stage Description */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Map className="text-blue-400" size={20} />
          </div>
          <div>
            <h3 className="font-medium text-slate-200 mb-1">
              Plan Your Roadmap
            </h3>
            <p className="text-sm text-slate-400">
              Define the main sections of your application and the data entities
              (models) that will power it. Sections can depend on each other, and
              entities can have relationships.
            </p>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-red-400 font-medium text-sm mb-1">
                Please fix the following:
              </p>
              <ul className="list-disc list-inside text-sm text-red-400/80 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Sections */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Layers size={16} className="text-cyan-400" />
            Sections
          </h4>
          <button
            type="button"
            onClick={addSection}
            disabled={isProcessing}
            className="flex items-center gap-1 px-3 py-1.5 text-sm rounded bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-50"
          >
            <Plus size={14} />
            Add Section
          </button>
        </div>
        <div className="space-y-3">
          {sections.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-700 rounded-lg">
              No sections yet. Click "Add Section" to define your app's modules.
            </div>
          ) : (
            sections.map((section, index) => (
              <SectionEditor
                key={index}
                section={section}
                index={index}
                allSections={sections}
                onChange={(s) => updateSection(index, s)}
                onRemove={() => removeSection(index)}
                disabled={isProcessing}
              />
            ))
          )}
        </div>
      </div>

      {/* Entities */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Database size={16} className="text-purple-400" />
            Data Entities
          </h4>
          <button
            type="button"
            onClick={addEntity}
            disabled={isProcessing}
            className="flex items-center gap-1 px-3 py-1.5 text-sm rounded bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-50"
          >
            <Plus size={14} />
            Add Entity
          </button>
        </div>
        <div className="space-y-3">
          {entities.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-700 rounded-lg">
              No entities yet. Click "Add Entity" to define your data models.
            </div>
          ) : (
            entities.map((entity, index) => (
              <EntityEditor
                key={index}
                entity={entity}
                index={index}
                allEntities={entities}
                onChange={(e) => updateEntity(index, e)}
                onRemove={() => removeEntity(index)}
                disabled={isProcessing}
              />
            ))
          )}
        </div>
      </div>

      {/* Previous Output Feedback */}
      {lastOutput && !lastOutput.passed && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <h4 className="text-yellow-400 font-medium text-sm mb-2">
            Feedback from Iteration {lastOutput.iteration}
          </h4>
          <p className="text-slate-400 text-sm">{lastOutput.feedback}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end pt-4 border-t border-slate-800">
        <button
          type="submit"
          disabled={isProcessing}
          className="flex items-center gap-2 px-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Processing...
            </>
          ) : (
            <>
              <Map size={18} />
              {lastOutput ? 'Refine Roadmap' : 'Submit Roadmap'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default RoadmapStage;

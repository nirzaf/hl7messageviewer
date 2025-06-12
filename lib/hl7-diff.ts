import type { ParsedHL7Message, HL7Segment } from "./hl7-parser";

export type DiffType = 'added' | 'removed' | 'modified' | 'common';

export interface FieldDiff {
  fieldIndex: number;
  diffType: DiffType;
  valueA?: string; // Value from message A's field
  valueB?: string; // Value from message B's field
  // Optional: For future component-level diffing
  // componentDiffs?: ComponentDiff[];
}

export interface SegmentDiff {
  segmentName: string;
  type: DiffType; // 'added', 'removed', 'modified', 'common'
  fieldsA?: HL7Segment['fields']; // Original fields from A (useful for 'removed' or context)
  fieldsB?: HL7Segment['fields']; // Original fields from B (useful for 'added' or context)
  fieldDiffs?: FieldDiff[]; // Populated if type is 'modified' or 'common' with field details
  originalIndexA?: number; // Original index in message A
  originalIndexB?: number; // Original index in message B
}

export interface DiffResult {
  segments: SegmentDiff[];
  // Add more summary fields later if needed (e.g., totalAdded, totalRemoved)
}

/**
 * Compares two parsed HL7 messages and returns the differences.
 * Initial version focuses on segment-level differences (added, removed, common).
 */
export function compareHl7Messages(
  msgA: ParsedHL7Message | null,
  msgB: ParsedHL7Message | null
): DiffResult {
  const result: DiffResult = { segments: [] };

  if (!msgA || !msgB) {
    // Handle cases where one or both messages are not parsed (e.g. invalid input)
    if (msgA) {
      msgA.segments.forEach((segA, index) => {
        result.segments.push({
          segmentName: segA.name,
          type: 'removed', // All segments of A are 'removed' if B is null
          fieldsA: segA.fields,
          originalIndexA: index,
        });
      });
    }
    if (msgB) {
      msgB.segments.forEach((segB, index) => {
        result.segments.push({
          segmentName: segB.name,
          type: 'added', // All segments of B are 'added' if A is null
          fieldsB: segB.fields,
          originalIndexB: index,
        });
      });
    }
    return result;
  }

  const segmentsA = msgA.segments.map((seg, index) => ({ ...seg, originalIndex: index, processed: false }));
  const segmentsB = msgB.segments.map((seg, index) => ({ ...seg, originalIndex: index, processed: false }));

  // Function to compare fields within two common segments
  function compareFields(segmentA: HL7Segment, segmentB: HL7Segment): FieldDiff[] {
    const fieldDiffs: FieldDiff[] = [];
    const maxFields = Math.max(segmentA.fields.length, segmentB.fields.length);

    for (let i = 0; i < maxFields; i++) {
      const fieldA = segmentA.fields[i];
      const fieldB = segmentB.fields[i];

      if (fieldA && fieldB) {
        if (fieldA.value !== fieldB.value) {
          fieldDiffs.push({
            fieldIndex: i,
            diffType: 'modified',
            valueA: fieldA.value,
            valueB: fieldB.value,
          });
        } else {
          fieldDiffs.push({
            fieldIndex: i,
            diffType: 'common',
            valueA: fieldA.value,
          });
        }
      } else if (fieldA) {
        fieldDiffs.push({
          fieldIndex: i,
          diffType: 'removed',
          valueA: fieldA.value,
        });
      } else if (fieldB) {
        fieldDiffs.push({
          fieldIndex: i,
          diffType: 'added',
          valueB: fieldB.value,
        });
      }
    }
    return fieldDiffs;
  }


  // Identify common segments and segments unique to A
  segmentsA.forEach((segA) => {
    // Try to find a matching segment in B. For now, simple match by name and order.
    // A more sophisticated approach might involve looking for matching IDs (e.g. MSH-10, PID-3) or sequence numbers.
    // This simple version will mark the first occurrence of a segment name as common if found in B.
    const matchingIndexB = segmentsB.findIndex(
      (segB) => !segB.processed && segB.name === segA.name
    );

    if (matchingIndexB !== -1) {
      const segB = segmentsB[matchingIndexB];
      segB.processed = true;
      segA.processed = true;

      const fieldDiffs = compareFields(segA, segB);
      const segmentType = fieldDiffs.some(fd => fd.diffType !== 'common') ? 'modified' : 'common';

      result.segments.push({
        segmentName: segA.name,
        type: segmentType,
        fieldsA: segA.fields, // Keep original fields for context if needed by UI
        fieldsB: segB.fields,
        fieldDiffs: fieldDiffs,
        originalIndexA: segA.originalIndex,
        originalIndexB: segB.originalIndex,
      });
    } else {
      // Segment in A but not in B
      result.segments.push({
        segmentName: segA.name,
        type: 'removed',
        fieldsA: segA.fields,
        originalIndexA: segA.originalIndex,
      });
    }
  });

  // Identify segments unique to B (those not processed yet)
  segmentsB.forEach((segB) => {
    if (!segB.processed) {
      result.segments.push({
        segmentName: segB.name,
        type: 'added',
        fieldsB: segB.fields,
        originalIndexB: segB.originalIndex,
      });
    }
  });

  // Simple sort to group by original index primarily, then by type to keep order somewhat logical
  result.segments.sort((a, b) => {
    const indexA = a.originalIndexA ?? a.originalIndexB ?? Infinity;
    const indexB = b.originalIndexA ?? b.originalIndexB ?? Infinity;
    if (indexA !== indexB) return indexA - indexB;
    // Basic secondary sort for consistent ordering of added/removed at same conceptual "location"
    if (a.type === 'removed' && b.type === 'added') return -1;
    if (a.type === 'added' && b.type === 'removed') return 1;
    return 0;
  });


  return result;
}

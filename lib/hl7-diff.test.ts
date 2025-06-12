import { describe, it, expect } from 'vitest';
import { HL7Parser, type ParsedHL7Message } from './hl7-parser';
import { compareHl7Messages, type DiffResult, type SegmentDiff, type FieldDiff } from './hl7-diff';

// Helper function to parse messages for tests
const parseTestMessages = (rawA: string | null, rawB: string | null): { msgA: ParsedHL7Message | null, msgB: ParsedHL7Message | null } => {
  const parser = new HL7Parser();
  const msgA = rawA ? parser.parse(rawA).message : null;
  const msgB = rawB ? parser.parse(rawB).message : null;
  return { msgA, msgB };
};

describe('compareHl7Messages', () => {
  const mshA = "MSH|^~\\&|APP_A|FAC_A|||202301011200||ADT^A01|MSG001|P|2.3";
  const pidA = "PID|1||PATID123^^^MRN|DOE^JOHN^A|19900101|M";
  const pv1A = "PV1|1|I|WARD1^ROOM1^BED1";
  const dg1A = "DG1|1||D123^Primary Diagnosis";
  const nk1A = "NK1|1|DOE^JANE^SPOUSE";

  const mshB = "MSH|^~\\&|APP_A|FAC_A|||202301011200||ADT^A01|MSG001|P|2.3"; // Identical MSH
  const pidB_modified = "PID|1||PATID123^^^MRN|DOE^JANE^X|19900101|F"; // Modified name and sex
  const pv1B_extraField = "PV1|1|I|WARD1^ROOM1^BED1||||||ADM002"; // Extra field (admission type)
  const nk1B = "NK1|1|SMITH^PETER^SPOUSE"; // Different NK1

  it('should return all common for identical messages', () => {
    const rawMsgA = `${mshA}\n${pidA}\n${pv1A}`;
    const rawMsgB = `${mshA}\n${pidA}\n${pv1A}`;
    const { msgA, msgB } = parseTestMessages(rawMsgA, rawMsgB);
    const result = compareHl7Messages(msgA, msgB);

    expect(result.segments.every(s => s.type === 'common')).toBe(true);
    expect(result.segments.length).toBe(3);
    result.segments.forEach(segDiff => {
      expect(segDiff.fieldDiffs?.every(f => f.diffType === 'common')).toBe(true);
    });
  });

  it('should handle completely different messages (only MSH common)', () => {
    const rawMsgA = `${mshA}\n${pidA}\n${pv1A}`;
    const rawMsgB = `${mshB}\n${nk1B}`; // Different segments after MSH
    const { msgA, msgB } = parseTestMessages(rawMsgA, rawMsgB);
    const result = compareHl7Messages(msgA, msgB);

    const mshDiff = result.segments.find(s => s.segmentName === 'MSH');
    expect(mshDiff?.type).toBe('common');

    const pidDiff = result.segments.find(s => s.segmentName === 'PID');
    expect(pidDiff?.type).toBe('removed');
    expect(pidDiff?.originalIndexA).toBe(1);


    const pv1Diff = result.segments.find(s => s.segmentName === 'PV1');
    expect(pv1Diff?.type).toBe('removed');
    expect(pv1Diff?.originalIndexA).toBe(2);

    const nk1Diff = result.segments.find(s => s.segmentName === 'NK1');
    expect(nk1Diff?.type).toBe('added');
    expect(nk1Diff?.originalIndexB).toBe(1);
  });

  it('should identify segment-level additions and removals', () => {
    const rawMsgA = `${mshA}\n${pidA}\n${dg1A}`; // PID, DG1
    const rawMsgB = `${mshB}\n${pidA}\n${nk1A}`; // PID, NK1
    const { msgA, msgB } = parseTestMessages(rawMsgA, rawMsgB);
    const result = compareHl7Messages(msgA, msgB);

    const dg1Diff = result.segments.find(s => s.segmentName === 'DG1');
    expect(dg1Diff?.type).toBe('removed');
    expect(dg1Diff?.originalIndexA).toBe(2);

    const nk1Diff = result.segments.find(s => s.segmentName === 'NK1');
    expect(nk1Diff?.type).toBe('added');
    expect(nk1Diff?.originalIndexB).toBe(2);

    const pidDiff = result.segments.find(s => s.segmentName === 'PID');
    expect(pidDiff?.type).toBe('common');
  });

  it('should detect field-level modifications in a common segment', () => {
    const rawMsgA = `${mshA}\n${pidA}`;
    const rawMsgB = `${mshB}\n${pidB_modified}`;
    const { msgA, msgB } = parseTestMessages(rawMsgA, rawMsgB);
    const result = compareHl7Messages(msgA, msgB);

    const pidDiff = result.segments.find(s => s.segmentName === 'PID');
    expect(pidDiff?.type).toBe('modified');
    expect(pidDiff?.fieldDiffs).toBeDefined();

    const nameFieldDiff = pidDiff?.fieldDiffs?.find(f => f.fieldIndex === 4); // PID-4 Patient Name (0-indexed in fields array, but 4th field data)
                                                                              // PID.0=PID, PID.1=SetID, PID.2=ExtID, PID.3=IntID, PID.4=Name
    expect(nameFieldDiff?.diffType).toBe('modified');
    expect(nameFieldDiff?.valueA).toBe('DOE^JOHN^A');
    expect(nameFieldDiff?.valueB).toBe('DOE^JANE^X');

    const sexFieldDiff = pidDiff?.fieldDiffs?.find(f => f.fieldIndex === 6); // PID-6 Sex
    expect(sexFieldDiff?.diffType).toBe('modified');
    expect(sexFieldDiff?.valueA).toBe('M');
    expect(sexFieldDiff?.valueB).toBe('F');
  });

  it('should detect fields added/removed within a common segment', () => {
    // PV1 in msgA has 3 fields (PV1, 1, I, WARD1...)
    // PV1 in msgB has an extra field at index 9 (0-indexed)
    const rawMsgA = `${mshA}\n${pv1A}`; // PV1|1|I|WARD1^ROOM1^BED1
    const rawMsgB = `${mshB}\n${pv1B_extraField}`; // PV1|1|I|WARD1^ROOM1^BED1||||||ADM002
    const { msgA, msgB } = parseTestMessages(rawMsgA, rawMsgB);
    const result = compareHl7Messages(msgA, msgB);

    const pv1Diff = result.segments.find(s => s.segmentName === 'PV1');
    expect(pv1Diff?.type).toBe('modified');
    expect(pv1Diff?.fieldDiffs).toBeDefined();

    // PV1.0 to PV1.3 should be common
    expect(pv1Diff?.fieldDiffs?.find(f => f.fieldIndex === 3)?.diffType).toBe('common');

    // Fields PV1.4 to PV1.8 in B are empty but present, vs not present or fewer fields in A.
    // The current diff logic might mark these as 'modified' if A has fewer fields and B has empty strings there.
    // Or 'added' if A truly has fewer fields.
    // PV1 in msgA (parsed): fields[0]="PV1", fields[1]="1", fields[2]="I", fields[3]="WARD1^ROOM1^BED1" (length 4)
    // PV1 in msgB (parsed): fields[0]="PV1", fields[1]="1", fields[2]="I", fields[3]="WARD1^ROOM1^BED1", fields[4]="", ..., fields[9]="ADM002" (length 10)

    const extraFieldDiff = pv1Diff?.fieldDiffs?.find(f => f.fieldIndex === 9); // PV1-10 (Admission Type in B)
    expect(extraFieldDiff?.diffType).toBe('added');
    expect(extraFieldDiff?.valueB).toBe('ADM002');

    // Check that one of the empty fields in B that's not in A is also 'added'
    const emptyAddedField = pv1Diff?.fieldDiffs?.find(f => f.fieldIndex === 4);
    expect(emptyAddedField?.diffType).toBe('added');
    expect(emptyAddedField?.valueB).toBe('');
  });

  describe('Null or Empty Message Inputs', () => {
    it('should handle msgA as null', () => {
      const rawMsgB = `${mshB}\n${pidA}`;
      const { msgB } = parseTestMessages(null, rawMsgB);
      const result = compareHl7Messages(null, msgB);
      expect(result.segments.length).toBe(2);
      expect(result.segments.every(s => s.type === 'added')).toBe(true);
      expect(result.segments[0].segmentName).toBe('MSH');
      expect(result.segments[1].segmentName).toBe('PID');
    });

    it('should handle msgB as null', () => {
      const rawMsgA = `${mshA}\n${pidA}`;
      const { msgA } = parseTestMessages(rawMsgA, null);
      const result = compareHl7Messages(msgA, null);
      expect(result.segments.length).toBe(2);
      expect(result.segments.every(s => s.type === 'removed')).toBe(true);
      expect(result.segments[0].segmentName).toBe('MSH');
      expect(result.segments[1].segmentName).toBe('PID');
    });

    it('should handle both messages as null', () => {
      const result = compareHl7Messages(null, null);
      expect(result.segments.length).toBe(0);
    });

    it('should handle one message parsed, one failed to parse (is null)', () => {
        const rawMsgA = `${mshA}\n${pidA}`;
        const { msgA } = parseTestMessages(rawMsgA, "INVALID_HL7_B"); // msgB will be null
        const result = compareHl7Messages(msgA, null); // Explicitly pass null for msgB
        expect(result.segments.length).toBe(2);
        expect(result.segments.every(s => s.type === 'removed')).toBe(true);
    });
  });
});

import { describe, it, expect, vi } from 'vitest';
import { HL7Parser } from './hl7-parser';
import * as HL7Definitions from './hl7-definitions'; // To mock getFieldDefinition

describe('HL7Parser', () => {
  const sampleMSH = 'MSH|^~\\&|SENDING_APP|SENDING_FACILITY|RECEIVING_APP|RECEIVING_FACILITY|20230101120000||ADT^A01|MSG00001|P|2.7';

  it('should parse a simple valid HL7 message', () => {
    const message = `${sampleMSH}\nPID|1||12345^^^MRN`;
    const parser = new HL7Parser();
    const result = parser.parse(message);

    expect(result.errors).toHaveLength(0);
    expect(result.message).not.toBeNull();
    if (!result.message) return; // Type guard

    expect(result.message.segments).toHaveLength(2);
    expect(result.message.segments[0].name).toBe('MSH');
    expect(result.message.segments[1].name).toBe('PID');
    expect(result.message.version).toBe('2.7');
    expect(result.message.messageType).toBe('ADT^A01');
    expect(result.message.controlId).toBe('MSG00001');
    expect(result.message.encodingCharacters.fieldSeparator).toBe('|');
    expect(result.message.encodingCharacters.componentSeparator).toBe('^');
  });

  it('should correctly parse fields, components, and sub-components', () => {
    const message = `${sampleMSH}\nPID|1|PATID123^CHECKDIGIT^IDTYPE^AUTH^ASSIGN_FAC&SUBCOMP1&SUBCOMP2~PATID456|FIELD3`;
    const parser = new HL7Parser();
    const result = parser.parse(message);

    expect(result.errors).toHaveLength(0);
    expect(result.message).not.toBeNull();
    if (!result.message) return;

    const pidSegment = result.message.segments.find(s => s.name === 'PID');
    expect(pidSegment).toBeDefined();
    if (!pidSegment) return;

    // PID-2: PATID123^CHECKDIGIT^IDTYPE^AUTH^ASSIGN_FAC&SUBCOMP1&SUBCOMP2~PATID456
    expect(pidSegment.fields[2].value).toBe('PATID123^CHECKDIGIT^IDTYPE^AUTH^ASSIGN_FAC&SUBCOMP1&SUBCOMP2~PATID456');
    expect(pidSegment.fields[2].repetitions).toHaveLength(2);
    expect(pidSegment.fields[2].repetitions[0]).toBe('PATID123^CHECKDIGIT^IDTYPE^AUTH^ASSIGN_FAC&SUBCOMP1&SUBCOMP2');
    expect(pidSegment.fields[2].repetitions[1]).toBe('PATID456');

    // Components of the first repetition
    expect(pidSegment.fields[2].components).toHaveLength(5);
    expect(pidSegment.fields[2].components[0]).toBe('PATID123');
    expect(pidSegment.fields[2].components[4]).toBe('ASSIGN_FAC&SUBCOMP1&SUBCOMP2');

    // Sub-components of the 5th component of the first repetition
    expect(pidSegment.fields[2].subComponents[4]).toHaveLength(3);
    expect(pidSegment.fields[2].subComponents[4][0]).toBe('ASSIGN_FAC');
    expect(pidSegment.fields[2].subComponents[4][1]).toBe('SUBCOMP1');
    expect(pidSegment.fields[2].subComponents[4][2]).toBe('SUBCOMP2');
  });

  it('should handle non-standard encoding characters', () => {
    const nonStdMSH = 'MSH@#$*!@SENDING_APP@SENDING_FACILITY||||20230101120000||ADT^A01|MSG00002|P|2.3';
    const message = `${nonStdMSH}\nPID@1@PATID789`;
    const parser = new HL7Parser();
    const result = parser.parse(message);

    expect(result.errors).toHaveLength(0);
    expect(result.message).not.toBeNull();
    if (!result.message) return;

    expect(result.message.encodingCharacters.fieldSeparator).toBe('@');
    expect(result.message.encodingCharacters.componentSeparator).toBe('#');
    expect(result.message.encodingCharacters.repetitionSeparator).toBe('$');
    expect(result.message.encodingCharacters.escapeCharacter).toBe('*');
    expect(result.message.encodingCharacters.subComponentSeparator).toBe('!');

    const pidSegment = result.message.segments.find(s => s.name === 'PID');
    expect(pidSegment).toBeDefined();
    if (!pidSegment) return;
    expect(pidSegment.fields[2].value).toBe('PATID789');
  });

  describe('Error Handling', () => {
    it('should return an error for an empty message', () => {
      const parser = new HL7Parser();
      const result = parser.parse('');
      expect(result.message).toBeNull();
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('critical');
      expect(result.errors[0].message).toBe('Empty message');
    });

    it('should return an error if message does not start with MSH', () => {
      const parser = new HL7Parser();
      const result = parser.parse('PID|1||12345');
      expect(result.message).toBeNull();
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('critical');
      expect(result.errors[0].message).toBe('Message must start with MSH segment');
    });

    it('should handle MSH segment too short for encoding characters', () => {
      const parser = new HL7Parser();
      const result = parser.parse('MSH|^~\\'); // Too short
      expect(result.message).toBeNull();
      expect(result.errors.some(e => e.message === 'Invalid MSH segment - too short for encoding characters')).toBe(true);
    });
  });

  describe('Validation Logic (with mocked definitions)', () => {
    let parser: HL7Parser;

    beforeEach(() => {
      parser = new HL7Parser();
      // Mock getFieldDefinition
      vi.spyOn(HL7Definitions, 'getFieldDefinition');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should generate an error for a missing required field', () => {
      const message = `${sampleMSH}\nPID|1||`; // PID-3 is missing
      (HL7Definitions.getFieldDefinition as ReturnType<typeof vi.spyOn>).mockImplementation((segmentName, fieldIndex, version) => {
        if (segmentName === 'PID' && fieldIndex === 3 && version === '2.7') {
          return { name: 'Patient ID (Internal)', dataType: 'CX', required: true, repeatable: true, description:"" };
        }
        return null;
      });

      const result = parser.parse(message);
      expect(result.message).not.toBeNull();
      const pidErrors = result.errors.filter(e => e.segmentName === 'PID' && e.fieldIndex === 3);
      expect(pidErrors.length).toBeGreaterThan(0);
      expect(pidErrors[0].message).toBe('Field is required.');
      expect(pidErrors[0].severity).toBe('error');
      expect(pidErrors[0].fieldName).toBe('Patient ID (Internal)');
    });

    it('should generate an error for a field exceeding maxLength', () => {
      const message = `${sampleMSH}\nPV1|1|THIS_VALUE_IS_TOO_LONG`; // PV1-2
      (HL7Definitions.getFieldDefinition as ReturnType<typeof vi.spyOn>).mockImplementation((segmentName, fieldIndex, version) => {
        if (segmentName === 'PV1' && fieldIndex === 2 && version === '2.7') {
          return { name: 'Patient Class', dataType: 'IS', required: true, repeatable: false, length: 5, description:"" }; // Max length 5
        }
        return null;
      });

      const result = parser.parse(message);
      expect(result.message).not.toBeNull();
      const pv1Errors = result.errors.filter(e => e.segmentName === 'PV1' && e.fieldIndex === 2);
      expect(pv1Errors.length).toBeGreaterThan(0);
      expect(pv1Errors[0].message).toBe('Field value exceeds maximum length of 5.');
      expect(pv1Errors[0].severity).toBe('error');
      expect(pv1Errors[0].fieldName).toBe('Patient Class');
    });

    it('should generate a warning for an unknown segment type', () => {
      const message = `${sampleMSH}\nZXY|1|SomeData`;
      // No need to mock getSegmentDefinition if it correctly returns null for unknown segments
      // The parser's internal call to getSegmentDefinition will handle this.
      // We assume getSegmentDefinition is tested elsewhere or works as expected.

      const result = parser.parse(message);
      expect(result.message).not.toBeNull();
      const zxyWarnings = result.errors.filter(e => e.segmentName === 'ZXY' && e.severity === 'warning');
      expect(zxyWarnings.length).toBeGreaterThan(0);
      expect(zxyWarnings[0].message).toContain("Segment type 'ZXY' is not defined for HL7 version 2.7.");
    });
  });

  it('should extract version correctly from MSH-12', () => {
    const parser = new HL7Parser();
    const result = parser.parse(sampleMSH);
    expect(result.message?.version).toBe('2.7');
  });

  it('should handle fields with only subcomponents (edge case)', () => {
    const message = `${sampleMSH}\nABC|&&SUBCOMP_ONLY`; // Field 1 is empty, Field 2 is '&&SUBCOMP_ONLY'
    const parser = new HL7Parser();
    const result = parser.parse(message);

    // Expect a warning for undefined segment "ABC", but no other errors.
    const nonWarningErrors = result.errors.filter(e => e.severity !== 'warning');
    expect(nonWarningErrors).toHaveLength(0);

    const abcSegment = result.message?.segments.find(s => s.name === 'ABC');
    expect(abcSegment).toBeDefined();
    if (!abcSegment) return;

    // The input is "ABC|&&SUBCOMP_ONLY"
    // fields[0] is "ABC"
    // fields[1] is "&&SUBCOMP_ONLY"
    expect(abcSegment.fields).toHaveLength(2); // Segment name + 1 field

    expect(abcSegment.fields[1].value).toBe('&&SUBCOMP_ONLY');
    // encodingCharacters from sampleMSH are |^~\&|
    // componentSeparator is '^'
    // subComponentSeparator is '&'
    expect(abcSegment.fields[1].components).toEqual(['&&SUBCOMP_ONLY']); // No component separator '^' in string
    expect(abcSegment.fields[1].subComponents).toEqual([['', '', 'SUBCOMP_ONLY']]); // Split by '&'
  });

});

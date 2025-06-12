import { getFieldDefinition, getSegmentDefinition } from "./hl7-definitions";

export interface HL7Field {
  value: string;
  components: string[];
  subComponents: string[][];
  repetitions: string[];
}

export interface HL7Segment {
  name: string;
  fields: HL7Field[];
  raw: string;
  fieldIndex?: number; // For MSH, this will be used to map to definition indices
}

export interface ParsedHL7Message {
  version: string;
  messageType: string;
  controlId: string;
  segments: HL7Segment[];
  encodingCharacters: {
    fieldSeparator: string;
    componentSeparator: string;
    repetitionSeparator: string;
    escapeCharacter: string;
    subComponentSeparator: string;
  };
}

export interface HL7Error {
  type: "warning" | "error" | "critical";
  message: string;
  line: number;
  position: number;
  segmentName?: string;
  fieldName?: string;
  severity?: "error" | "warning" | "info";
  fieldIndex?: number;
}

export interface ParseResult {
  message: ParsedHL7Message | null;
  errors: HL7Error[];
}

export class HL7Parser {
  private errors: HL7Error[] = [];
  private encodingCharacters!: ParsedHL7Message['encodingCharacters']; // Initialized in parseMSHHeader

  private parseField(fieldString: string): HL7Field {
    const { componentSeparator, repetitionSeparator, subComponentSeparator } = this.encodingCharacters;

    const repetitions = fieldString.split(repetitionSeparator);
    const firstRepetition = repetitions[0] || "";
    const components = firstRepetition.split(componentSeparator);
    const subComponents = components.map((component) => component.split(subComponentSeparator));

    return {
      value: fieldString,
      components,
      subComponents,
      repetitions,
    };
  }

  private parseMSHSegment(line: string, lineNumber: number): HL7Segment {
    const segmentName = line.substring(0, 3);
    const fieldSeparator = line[3];
    const encodingCharsString = line.substring(4, 8); // Component, Repetition, Escape, SubComponent

    this.encodingCharacters = {
      fieldSeparator: fieldSeparator || "|",
      componentSeparator: encodingCharsString[0] || "^",
      repetitionSeparator: encodingCharsString[1] || "~",
      escapeCharacter: encodingCharsString[2] || "\\",
      subComponentSeparator: encodingCharsString[3] || "&",
    };

    // For MSH, fields are structured as:
    // fields[0] = "MSH"
    // fields[1] = Field Separator (e.g. "|")
    // fields[2] = Encoding Characters (e.g. "^~\\&")
    // fields[3] = MSH.3 Sending Application
    // ...
    // fields[X] = MSH.X (standard field X)
    const fields: HL7Field[] = [];
    fields.push(this.parseField(segmentName)); // MSH.0 in definition
    fields.push(this.parseField(this.encodingCharacters.fieldSeparator)); // MSH.1 in definition
    fields.push(this.parseField(encodingCharsString)); // MSH.2 in definition

    const mshDataFields = line.substring(9).split(this.encodingCharacters.fieldSeparator);
    mshDataFields.forEach(fieldString => {
      fields.push(this.parseField(fieldString));
    });

    const mshSegment: HL7Segment = { name: segmentName, fields, raw: line };

    // Perform validation for MSH segment fields right after parsing it
    const version = fields[12]?.value || "2.5"; // MSH.12 is Version ID
    this.validateSegmentFields(mshSegment, version, lineNumber);

    return mshSegment;
  }

  private parseSegment(line: string, lineNumber: number, versionForDefs: string): HL7Segment {
    const segmentName = line.substring(0, 3);
    const fieldStrings = line.split(this.encodingCharacters.fieldSeparator);

    const fields: HL7Field[] = [];
    // For non-MSH segments, fieldStrings[0] is segment name, fieldStrings[1] is Field 1, etc.
    // Our definitions are 0-indexed (e.g. PID.0 = Segment Name, PID.1 = Set ID)
    // So, the loop structure is correct.
    for (const fieldString of fieldStrings) {
      fields.push(this.parseField(fieldString));
    }

    const segment: HL7Segment = { name: segmentName, fields, raw: line };
    this.validateSegmentFields(segment, versionForDefs, lineNumber);
    return segment;
  }

  private validateSegmentFields(segment: HL7Segment, version: string, lineNumber: number) {
    const segmentDefinition = getSegmentDefinition(segment.name, version);

    if (!segmentDefinition && segment.name !== "MSH") { // MSH is always "known" structurally
        this.errors.push({
            type: 'warning',
            message: `Segment type '${segment.name}' is not defined for HL7 version ${version}.`,
            line: lineNumber,
            position: 0,
            segmentName: segment.name,
            severity: 'warning',
        });
    }

    // `i` is the index in the `segment.fields` array.
    // This index directly corresponds to the field definition index in hl7-definitions.ts
    // e.g. for PID, fields[0] is PID.0 (Segment Name), fields[1] is PID.1 (Set ID)
    // for MSH, fields[0] is MSH.0 (Segment Name), fields[1] is MSH.1 (Field Separator), etc.
    segment.fields.forEach((currentField, i) => {
      const fieldDefinition = getFieldDefinition(segment.name, i, version);
      if (fieldDefinition) {
        if (fieldDefinition.required && (!currentField.value || currentField.value.trim() === "")) {
          this.errors.push({
            type: "error",
            message: `Field is required.`,
            line: lineNumber,
            position: 0,
            segmentName: segment.name,
            fieldName: fieldDefinition.name || `Field ${i}`,
            severity: "error",
            fieldIndex: i,
          });
        }
        if (fieldDefinition.length && currentField.value && currentField.value.length > fieldDefinition.length) {
          this.errors.push({
            type: "error",
            message: `Field value exceeds maximum length of ${fieldDefinition.length}.`,
            line: lineNumber,
            position: 0,
            segmentName: segment.name,
            fieldName: fieldDefinition.name || `Field ${i}`,
            severity: "error",
            fieldIndex: i,
          });
        }
      }
    });
  }


  parse(input: string): ParseResult {
    this.errors = [];

    try {
      const lines = input.split(/\r?\n/).filter((line) => line.trim());

      if (lines.length === 0) {
        this.errors.push({ type: "critical", message: "Empty message", line: 0, position: 0 });
        return { message: null, errors: this.errors };
      }

      const mshLine = lines[0];
      if (!mshLine.startsWith("MSH")) {
        this.errors.push({ type: "critical", message: "Message must start with MSH segment", line: 1, position: 0 });
        return { message: null, errors: this.errors };
      }
      if (mshLine.length < 8) { // Basic check for MSH structure before parsing encoding chars
        this.errors.push({ type: "critical", message: "Invalid MSH segment - too short for encoding characters", line: 1, position: 0 });
        return { message: null, errors: this.errors };
      }

      const mshSegment = this.parseMSHSegment(mshLine, 1); // This also sets this.encodingCharacters
      const segments: HL7Segment[] = [mshSegment];

      const versionForDefs = mshSegment.fields[12]?.value || "2.5"; // MSH.12 is Version ID

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          try {
            const segment = this.parseSegment(line, i + 1, versionForDefs);
            segments.push(segment);
          } catch (error) {
            this.errors.push({
              type: "error",
              message: error instanceof Error ? error.message : "Unknown error parsing segment",
              line: i + 1,
              position: 0,
              segmentName: line.substring(0, 3),
            });
          }
        }
      }

      if (segments.length === 0) { // Should not happen if MSH is present
        this.errors.push({ type: "critical", message: "No valid segments found", line: 0, position: 0 });
        return { message: null, errors: this.errors };
      }

      const version = mshSegment.fields[12]?.value || "2.5";      // MSH.12
      const messageType = mshSegment.fields[9]?.value || "Unknown"; // MSH.9
      const controlId = mshSegment.fields[10]?.value || "Unknown"; // MSH.10

      const message: ParsedHL7Message = {
        version,
        messageType,
        controlId,
        segments,
        encodingCharacters: this.encodingCharacters,
      };

      return { message, errors: this.errors };
    } catch (error) {
      // Catch critical errors not handled within the loop (e.g., MSH parsing itself if it throws early)
      this.errors.push({
        type: "critical",
        message: error instanceof Error ? error.message : "Critical parsing error",
        line: 0, // Or determine more accurately if possible
        position: 0,
      });
      return { message: null, errors: this.errors };
    }
  }
}

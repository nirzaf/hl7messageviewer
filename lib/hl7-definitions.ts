export interface HL7FieldDefinition {
  name: string
  description: string
  dataType: string
  length?: number
  required: boolean
  repeatable: boolean
  table?: string
  usage?: string
  example?: string
}

export interface HL7SegmentDefinition {
  name: string
  description: string
  purpose: string
  fields: { [key: number]: HL7FieldDefinition }
}

export interface HL7VersionedDefinition {
  [version: string]: HL7SegmentDefinition;
}

export const HL7_SEGMENTS: { [key: string]: HL7VersionedDefinition } = {
  MSH: {
    "2.5": { // Assuming existing definitions are for v2.5
      name: "Message Header",
    description:
      "The MSH segment defines the intent, source, destination, and some specifics of the syntax of a message.",
    purpose: "Contains message control information",
    fields: {
      0: {
        name: "Segment ID",
        description: "Segment identifier",
        dataType: "ST",
        length: 3,
        required: true,
        repeatable: false,
        example: "MSH",
      },
      1: {
        name: "Field Separator",
        description: "Field separator character",
        dataType: "ST",
        length: 1,
        required: true,
        repeatable: false,
        example: "|",
      },
      2: {
        name: "Encoding Characters",
        description: "Component separator, repetition separator, escape character, subcomponent separator",
        dataType: "ST",
        length: 4,
        required: true,
        repeatable: false,
        example: "^~\\&",
      },
      3: {
        name: "Sending Application",
        description: "Identifies the sending application",
        dataType: "HD",
        length: 227,
        required: false,
        repeatable: false,
        example: "EPIC",
      },
      4: {
        name: "Sending Facility",
        description: "Identifies the sending facility",
        dataType: "HD",
        length: 227,
        required: false,
        repeatable: false,
        example: "EPICADT",
      },
      5: {
        name: "Receiving Application",
        description: "Identifies the receiving application",
        dataType: "HD",
        length: 227,
        required: false,
        repeatable: false,
        example: "SMS",
      },
      6: {
        name: "Receiving Facility",
        description: "Identifies the receiving facility",
        dataType: "HD",
        length: 227,
        required: false,
        repeatable: false,
        example: "SMSADT",
      },
      7: {
        name: "Date/Time of Message",
        description: "Date and time message was created",
        dataType: "TS",
        length: 26,
        required: false,
        repeatable: false,
        example: "199912271408",
      },
      8: {
        name: "Security",
        description: "Security information",
        dataType: "ST",
        length: 40,
        required: false,
        repeatable: false,
      },
      9: {
        name: "Message Type",
        description: "Message type and trigger event",
        dataType: "MSG",
        length: 15,
        required: true,
        repeatable: false,
        example: "ADT^A04",
      },
      10: {
        name: "Message Control ID",
        description: "Unique message identifier",
        dataType: "ST",
        length: 20,
        required: true,
        repeatable: false,
        example: "1817457",
      },
      11: {
        name: "Processing ID",
        description: "Processing mode",
        dataType: "PT",
        length: 3,
        required: true,
        repeatable: false,
        example: "D",
      },
      12: {
        name: "Version ID",
        description: "HL7 version",
        dataType: "VID",
        length: 60,
        required: true,
        repeatable: false,
        example: "2.5",
      },
    },
    },
    "2.3": { // Placeholder for v2.3
      name: "Message Header",
      description: "The MSH segment defines the intent, source, destination, and some specifics of the syntax of a message for HL7 v2.3.",
      purpose: "Contains message control information for HL7 v2.3",
      fields: { // Simplified fields for placeholder
        1: { name: "Field Separator", description: "Field separator character", dataType: "ST", length: 1, required: true, repeatable: false },
        2: { name: "Encoding Characters", description: "Encoding characters", dataType: "ST", length: 4, required: true, repeatable: false },
        11: { name: "Version ID", description: "HL7 version for v2.3", dataType: "VID", length: 60, required: true, repeatable: false, example: "2.3" },
      }
    },
    "2.6": { // Placeholder for v2.6
      name: "Message Header",
      description: "The MSH segment defines the intent, source, destination, and some specifics of the syntax of a message for HL7 v2.6.",
      purpose: "Contains message control information for HL7 v2.6",
      fields: { // Simplified fields for placeholder
        1: { name: "Field Separator", description: "Field separator character", dataType: "ST", length: 1, required: true, repeatable: false },
        2: { name: "Encoding Characters", description: "Encoding characters", dataType: "ST", length: 4, required: true, repeatable: false },
        11: { name: "Version ID", description: "HL7 version for v2.6", dataType: "VID", length: 60, required: true, repeatable: false, example: "2.6" },
      }
    }
  },
  PID: {
    "2.5": { // Assuming existing definitions are for v2.5
      name: "Patient Identification",
    description:
      "The PID segment is used by all applications as the primary means of communicating patient identification information.",
    purpose: "Contains patient demographic and identification information",
    fields: {
      0: {
        name: "Segment ID",
        description: "Segment identifier",
        dataType: "ST",
        length: 3,
        required: true,
        repeatable: false,
        example: "PID",
      },
      1: {
        name: "Set ID",
        description: "Sequence number for multiple PID segments",
        dataType: "SI",
        length: 4,
        required: false,
        repeatable: false,
        example: "0001",
      },
      2: {
        name: "Patient ID (External)",
        description: "External patient identifier",
        dataType: "CX",
        length: 250,
        required: false,
        repeatable: false,
      },
      3: {
        name: "Patient ID (Internal)",
        description: "Internal patient identifier list",
        dataType: "CX",
        length: 250,
        required: true,
        repeatable: true,
        example: "0000112234^^^MR^MRN",
      },
      4: {
        name: "Alternate Patient ID",
        description: "Alternate patient identifier",
        dataType: "CX",
        length: 250,
        required: false,
        repeatable: true,
      },
      5: {
        name: "Patient Name",
        description: "Patient legal name",
        dataType: "XPN",
        length: 250,
        required: true,
        repeatable: true,
        example: "EVERYMAN^ADAM^A^III",
      },
      6: {
        name: "Mother's Maiden Name",
        description: "Mother's maiden name",
        dataType: "XPN",
        length: 250,
        required: false,
        repeatable: true,
      },
      7: {
        name: "Date/Time of Birth",
        description: "Patient date of birth",
        dataType: "TS",
        length: 26,
        required: false,
        repeatable: false,
        example: "19610615",
      },
      8: {
        name: "Administrative Sex",
        description: "Patient gender",
        dataType: "IS",
        length: 1,
        required: false,
        repeatable: false,
        table: "0001",
        example: "M",
      },
      9: {
        name: "Patient Alias",
        description: "Patient alias names",
        dataType: "XPN",
        length: 250,
        required: false,
        repeatable: true,
      },
      10: {
        name: "Race",
        description: "Patient race",
        dataType: "CE",
        length: 250,
        required: false,
        repeatable: true,
        table: "0005",
        example: "C",
      },
      11: {
        name: "Patient Address",
        description: "Patient address",
        dataType: "XAD",
        length: 250,
        required: false,
        repeatable: true,
        example: "1200 N ELM STREET^^GREENSBORO^NC^27401-1020",
      },
      12: {
        name: "County Code",
        description: "County code",
        dataType: "IS",
        length: 4,
        required: false,
        repeatable: false,
      },
      13: {
        name: "Phone Number - Home",
        description: "Home phone number",
        dataType: "XTN",
        length: 250,
        required: false,
        repeatable: true,
        example: "(919)379-1212",
      },
      14: {
        name: "Phone Number - Business",
        description: "Business phone number",
        dataType: "XTN",
        length: 250,
        required: false,
        repeatable: true,
      },
      15: {
        name: "Primary Language",
        description: "Patient primary language",
        dataType: "CE",
        length: 250,
        required: false,
        repeatable: false,
        example: "E",
      },
    },
    },
    "2.3": { // Placeholder for v2.3
      name: "Patient Identification",
      description: "The PID segment is used by all applications as the primary means of communicating patient identification information for HL7 v2.3.",
      purpose: "Contains patient demographic and identification information for HL7 v2.3",
      fields: {
        0: { name: "Segment ID", description: "Segment identifier", dataType: "ST", length: 3, required: true, repeatable: false, example: "PID" },
        1: { name: "Set ID - PID", description: "Set ID for PID segment", dataType: "SI", required: false, repeatable: false },
        3: { name: "Patient Identifier List (v2.3)", description: "Patient Identifier List for HL7 v2.3", dataType: "CX", required: true, repeatable: true, example: "12345^^^MPI" }, // Made required for v2.3
        5: { name: "Patient Name (v2.3)", description: "Patient Name for HL7 v2.3", dataType: "XPN", required: false, repeatable: true, example: "DOE^JOHN" }, // Made optional for v2.3
      }
    },
    "2.6": { // Placeholder for v2.6
      name: "Patient Identification",
      description: "The PID segment is used by all applications as the primary means of communicating patient identification information for HL7 v2.6.",
      purpose: "Contains patient demographic and identification information for HL7 v2.6",
      fields: {
        0: { name: "Segment ID", description: "Segment identifier", dataType: "ST", length: 3, required: true, repeatable: false, example: "PID" },
        1: { name: "Set ID - PID", description: "Set ID for PID segment", dataType: "SI", required: false, repeatable: false },
        3: { name: "Patient Identifier List (v2.6)", description: "Patient Identifier List for HL7 v2.6", dataType: "CX", required: true, repeatable: true, example: "67890^^^SITEID" },
        5: { name: "Patient Name (v2.6)", description: "Patient Name for HL7 v2.6", dataType: "XPN", required: true, repeatable: true, length: 50, example: "ROE^JANE" }, // Made required and changed maxLength to length for v2.6
      }
    }
  },
  PV1: {
    "2.5": { // Assuming existing definitions are for v2.5
      name: "Patient Visit",
    description:
      "The PV1 segment is used by Registration/Patient Administration applications to communicate information on an account or visit-specific basis.",
    purpose: "Contains visit-specific information",
    fields: {
      0: {
        name: "Segment ID",
        description: "Segment identifier",
        dataType: "ST",
        length: 3,
        required: true,
        repeatable: false,
        example: "PV1",
      },
      1: {
        name: "Set ID",
        description: "Sequence number",
        dataType: "SI",
        length: 4,
        required: false,
        repeatable: false,
        example: "0001",
      },
      2: {
        name: "Patient Class",
        description: "Patient class (I=Inpatient, O=Outpatient, etc.)",
        dataType: "IS",
        length: 1,
        required: true,
        repeatable: false,
        table: "0004",
        example: "I",
      },
      3: {
        name: "Assigned Patient Location",
        description: "Patient location",
        dataType: "PL",
        length: 80,
        required: false,
        repeatable: false,
        example: "2000^2012^01",
      },
      4: {
        name: "Admission Type",
        description: "Type of admission",
        dataType: "IS",
        length: 2,
        required: false,
        repeatable: false,
        table: "0007",
      },
      5: {
        name: "Preadmit Number",
        description: "Preadmission identifier",
        dataType: "CX",
        length: 250,
        required: false,
        repeatable: false,
      },
      6: {
        name: "Prior Patient Location",
        description: "Previous patient location",
        dataType: "PL",
        length: 80,
        required: false,
        repeatable: false,
      },
      7: {
        name: "Attending Doctor",
        description: "Attending physician",
        dataType: "XCN",
        length: 250,
        required: false,
        repeatable: true,
        example: "004777^ATTEND^AARON^A",
      },
      8: {
        name: "Referring Doctor",
        description: "Referring physician",
        dataType: "XCN",
        length: 250,
        required: false,
        repeatable: true,
      },
      9: {
        name: "Consulting Doctor",
        description: "Consulting physician",
        dataType: "XCN",
        length: 250,
        required: false,
        repeatable: true,
      },
      10: {
        name: "Hospital Service",
        description: "Hospital service",
        dataType: "IS",
        length: 3,
        required: false,
        repeatable: false,
        table: "0069",
        example: "SUR",
      },
    },
    },
    "2.3": { // Placeholder for v2.3
      name: "Patient Visit",
      description: "The PV1 segment is used by Registration/Patient Administration applications to communicate information on an account or visit-specific basis for HL7 v2.3.",
      purpose: "Contains visit-specific information for HL7 v2.3",
      fields: { // Simplified fields for placeholder
        2: { name: "Patient Class", description: "Patient class for v2.3", dataType: "IS", required: true, repeatable: false },
        7: { name: "Attending Doctor", description: "Attending physician for v2.3", dataType: "XCN", required: false, repeatable: true },
      }
    },
    "2.6": { // Placeholder for v2.6
      name: "Patient Visit",
      description: "The PV1 segment is used by Registration/Patient Administration applications to communicate information on an account or visit-specific basis for HL7 v2.6.",
      purpose: "Contains visit-specific information for HL7 v2.6",
      fields: { // Simplified fields for placeholder
        2: { name: "Patient Class", description: "Patient class for v2.6", dataType: "IS", required: true, repeatable: false },
        7: { name: "Attending Doctor", description: "Attending physician for v2.6", dataType: "XCN", required: false, repeatable: true },
      }
    }
  },
  OBX: {
    "2.5": { // Assuming existing definitions are for v2.5
      name: "Observation/Result",
    description: "The OBX segment is used to transmit a single observation or observation fragment.",
    purpose: "Contains observation results and values",
    fields: {
      0: {
        name: "Segment ID",
        description: "Segment identifier",
        dataType: "ST",
        length: 3,
        required: true,
        repeatable: false,
        example: "OBX",
      },
      1: {
        name: "Set ID",
        description: "Sequence number",
        dataType: "SI",
        length: 4,
        required: false,
        repeatable: false,
      },
      2: {
        name: "Value Type",
        description: "Data type of observation value",
        dataType: "ID",
        length: 2,
        required: false,
        repeatable: false,
        table: "0125",
        example: "NM",
      },
      3: {
        name: "Observation Identifier",
        description: "Observation identifier",
        dataType: "CE",
        length: 250,
        required: true,
        repeatable: false,
      },
      4: {
        name: "Observation Sub-ID",
        description: "Observation sub-identifier",
        dataType: "ST",
        length: 20,
        required: false,
        repeatable: false,
      },
      5: {
        name: "Observation Value",
        description: "Observation value",
        dataType: "Varies",
        required: false,
        repeatable: true,
      },
      6: {
        name: "Units",
        description: "Units of measure",
        dataType: "CE",
        length: 250,
        required: false,
        repeatable: false,
      },
      7: {
        name: "References Range",
        description: "Reference range for numeric values",
        dataType: "ST",
        length: 60,
        required: false,
        repeatable: false,
      },
      8: {
        name: "Abnormal Flags",
        description: "Abnormal flags",
        dataType: "IS",
        length: 5,
        required: false,
        repeatable: true,
        table: "0078",
      },
      9: {
        name: "Probability",
        description: "Probability of abnormality",
        dataType: "NM",
        length: 5,
        required: false,
        repeatable: false,
      },
      10: {
        name: "Nature of Abnormal Test",
        description: "Nature of abnormal test",
        dataType: "ID",
        length: 2,
        required: false,
        repeatable: true,
        table: "0080",
      },
    },
    },
    "2.3": { // Placeholder for v2.3
      name: "Observation/Result",
      description: "The OBX segment is used to transmit a single observation or observation fragment for HL7 v2.3.",
      purpose: "Contains observation results and values for HL7 v2.3",
      fields: { // Simplified fields for placeholder
        3: { name: "Observation Identifier", description: "Observation identifier for v2.3", dataType: "CE", required: true, repeatable: false },
        5: { name: "Observation Value", description: "Observation value for v2.3", dataType: "Varies", required: false, repeatable: true },
      }
    },
    "2.6": { // Placeholder for v2.6
      name: "Observation/Result",
      description: "The OBX segment is used to transmit a single observation or observation fragment for HL7 v2.6.",
      purpose: "Contains observation results and values for HL7 v2.6",
      fields: { // Simplified fields for placeholder
        3: { name: "Observation Identifier", description: "Observation identifier for v2.6", dataType: "CE", required: true, repeatable: false },
        5: { name: "Observation Value", description: "Observation value for v2.6", dataType: "Varies", required: false, repeatable: true },
      }
    }
  },
  NK1: {
    "2.5": { // Assuming existing definitions are for v2.5
      name: "Next of Kin/Associated Parties",
    description: "The NK1 segment contains information about the patient's other related parties.",
    purpose: "Contains next of kin and emergency contact information",
    fields: {
      0: {
        name: "Segment ID",
        description: "Segment identifier",
        dataType: "ST",
        length: 3,
        required: true,
        repeatable: false,
        example: "NK1",
      },
      1: {
        name: "Set ID",
        description: "Sequence number",
        dataType: "SI",
        length: 4,
        required: true,
        repeatable: false,
        example: "0001",
      },
      2: {
        name: "Name",
        description: "Next of kin name",
        dataType: "XPN",
        length: 250,
        required: false,
        repeatable: true,
        example: "JONES^BARBARA^K",
      },
      3: {
        name: "Relationship",
        description: "Relationship to patient",
        dataType: "CE",
        length: 250,
        required: false,
        repeatable: false,
        table: "0063",
        example: "10^MOTHER",
      },
      4: {
        name: "Address",
        description: "Next of kin address",
        dataType: "XAD",
        length: 250,
        required: false,
        repeatable: true,
      },
      5: {
        name: "Phone Number",
        description: "Phone number",
        dataType: "XTN",
        length: 250,
        required: false,
        repeatable: true,
      },
      6: {
        name: "Business Phone Number",
        description: "Business phone number",
        dataType: "XTN",
        length: 250,
        required: false,
        repeatable: true,
      },
      7: {
        name: "Contact Role",
        description: "Contact role",
        dataType: "CE",
        length: 250,
        required: false,
        repeatable: false,
        table: "0131",
      },
    },
    },
    "2.3": { // Placeholder for v2.3
      name: "Next of Kin/Associated Parties",
      description: "The NK1 segment contains information about the patient's other related parties for HL7 v2.3.",
      purpose: "Contains next of kin and emergency contact information for HL7 v2.3",
      fields: { // Simplified fields for placeholder
        2: { name: "Name", description: "Next of kin name for v2.3", dataType: "XPN", required: false, repeatable: true },
        3: { name: "Relationship", description: "Relationship to patient for v2.3", dataType: "CE", required: false, repeatable: false },
      }
    },
    "2.6": { // Placeholder for v2.6
      name: "Next of Kin/Associated Parties",
      description: "The NK1 segment contains information about the patient's other related parties for HL7 v2.6.",
      purpose: "Contains next of kin and emergency contact information for HL7 v2.6",
      fields: { // Simplified fields for placeholder
        2: { name: "Name", description: "Next of kin name for v2.6", dataType: "XPN", required: false, repeatable: true },
        3: { name: "Relationship", description: "Relationship to patient for v2.6", dataType: "CE", required: false, repeatable: false },
      }
    }
  },
}

export function getFieldDefinition(segmentName: string, fieldIndex: number, version: string = "2.5"): HL7FieldDefinition | null {
  const versionedSegment = HL7_SEGMENTS[segmentName]
  if (!versionedSegment) return null

  const segment = versionedSegment[version] || versionedSegment["2.5"] // Fallback to 2.5
  if (!segment) return null

  return segment.fields[fieldIndex] || null
}

export function getSegmentDefinition(segmentName: string, version: string = "2.5"): HL7SegmentDefinition | null {
  const versionedSegment = HL7_SEGMENTS[segmentName]
  if (!versionedSegment) return null

  return versionedSegment[version] || versionedSegment["2.5"] // Fallback to 2.5
}

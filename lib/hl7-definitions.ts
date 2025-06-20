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

export const HL7_SEGMENTS: { [key: string]: HL7SegmentDefinition } = {
  MSH: {
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
  PID: {
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
  PV1: {
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
  OBX: {
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
  NK1: {
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
}

export function getFieldDefinition(segmentName: string, fieldIndex: number): HL7FieldDefinition | null {
  const segment = HL7_SEGMENTS[segmentName]
  if (!segment) return null
  return segment.fields[fieldIndex] || null
}

export function getSegmentDefinition(segmentName: string): HL7SegmentDefinition | null {
  return HL7_SEGMENTS[segmentName] || null
}

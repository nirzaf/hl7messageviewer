export interface HL7Field {
  value: string
  components: string[]
  subComponents: string[][]
  repetitions: string[]
}

export interface HL7Segment {
  name: string
  fields: HL7Field[]
  raw: string
}

export interface ParsedHL7Message {
  version: string
  messageType: string
  controlId: string
  segments: HL7Segment[]
  encodingCharacters: {
    fieldSeparator: string
    componentSeparator: string
    repetitionSeparator: string
    escapeCharacter: string
    subComponentSeparator: string
  }
}

export interface HL7Error {
  type: "warning" | "error" | "critical"
  message: string
  line: number
  position: number
  segmentName?: string
}

export interface ParseResult {
  message: ParsedHL7Message | null
  errors: HL7Error[]
}

export class HL7Parser {
  private errors: HL7Error[] = []

  parse(input: string): ParseResult {
    this.errors = []

    try {
      const lines = input.split(/\r?\n/).filter((line) => line.trim())

      if (lines.length === 0) {
        throw new Error("Empty message")
      }

      // Parse MSH segment first to get encoding characters
      const mshLine = lines[0]
      if (!mshLine.startsWith("MSH")) {
        throw new Error("Message must start with MSH segment")
      }

      const encodingCharacters = this.parseEncodingCharacters(mshLine)
      const segments: HL7Segment[] = []

      // Parse all segments
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (line) {
          try {
            const segment = this.parseSegment(line, encodingCharacters, i + 1)
            segments.push(segment)
          } catch (error) {
            this.errors.push({
              type: "error",
              message: error instanceof Error ? error.message : "Unknown error",
              line: i + 1,
              position: 0,
              segmentName: line.substring(0, 3),
            })
          }
        }
      }

      if (segments.length === 0) {
        throw new Error("No valid segments found")
      }

      // Extract message metadata from MSH
      const mshSegment = segments[0]
      const version = mshSegment.fields[11]?.value || "2.5"
      const messageType = mshSegment.fields[8]?.value || "Unknown"
      const controlId = mshSegment.fields[9]?.value || "Unknown"

      const message: ParsedHL7Message = {
        version,
        messageType,
        controlId,
        segments,
        encodingCharacters,
      }

      return { message, errors: this.errors }
    } catch (error) {
      this.errors.push({
        type: "critical",
        message: error instanceof Error ? error.message : "Critical parsing error",
        line: 0,
        position: 0,
      })
      return { message: null, errors: this.errors }
    }
  }

  private parseEncodingCharacters(mshLine: string) {
    if (mshLine.length < 8) {
      throw new Error("Invalid MSH segment - too short")
    }

    return {
      fieldSeparator: mshLine[3] || "|",
      componentSeparator: mshLine[4] || "^",
      repetitionSeparator: mshLine[5] || "~",
      escapeCharacter: mshLine[6] || "\\",
      subComponentSeparator: mshLine[7] || "&",
    }
  }

  private parseSegment(line: string, encodingChars: any, lineNumber: number): HL7Segment {
    const segmentName = line.substring(0, 3)
    const fieldSeparator = encodingChars.fieldSeparator

    // Split by field separator, but handle MSH specially
    let fieldStrings: string[]
    if (segmentName === "MSH") {
      // MSH is special - field separator is part of the data
      fieldStrings = [segmentName, fieldSeparator + line.substring(4, 8), ...line.substring(8).split(fieldSeparator)]
    } else {
      fieldStrings = line.split(fieldSeparator)
    }

    const fields: HL7Field[] = []

    for (let i = 0; i < fieldStrings.length; i++) {
      const fieldString = fieldStrings[i]
      const field = this.parseField(fieldString, encodingChars)
      fields.push(field)
    }

    return {
      name: segmentName,
      fields,
      raw: line,
    }
  }

  private parseField(fieldString: string, encodingChars: any): HL7Field {
    const { componentSeparator, repetitionSeparator, subComponentSeparator } = encodingChars

    // Handle repetitions
    const repetitions = fieldString.split(repetitionSeparator)

    // Parse first repetition for components
    const firstRepetition = repetitions[0] || ""
    const components = firstRepetition.split(componentSeparator)

    // Parse sub-components for each component
    const subComponents = components.map((component) => component.split(subComponentSeparator))

    return {
      value: fieldString,
      components,
      subComponents,
      repetitions,
    }
  }
}

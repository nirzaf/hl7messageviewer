import { NextResponse } from 'next/server';
import { HL7Parser } from '@/lib/hl7-parser';

/**
 * @swagger
 * /api/parse:
 *   post:
 *     summary: Parses an HL7 message.
 *     description: Accepts a raw HL7 message string and returns the parsed structure along with any parsing errors.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: The raw HL7 message string.
 *                 example: "MSH|^~\\&|SENDING_APP|SENDING_FACILITY|RECEIVING_APP|RECEIVING_FACILITY|20230101120000||ADT^A01|MSG00001|P|2.7"
 *     responses:
 *       200:
 *         description: Successfully parsed the HL7 message.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 parsedMessage:
 *                   type: object
 *                   nullable: true
 *                   description: The parsed HL7 message structure, or null if critical parsing errors occurred.
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                   description: An array of parsing errors or warnings.
 *       400:
 *         description: Bad Request - Missing or invalid HL7 message in the request body.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal Server Error - An unexpected error occurred during parsing.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *     tags:
 *       - HL7 Parsing
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawHL7Message = body.message;

    if (!rawHL7Message || typeof rawHL7Message !== 'string') {
      return NextResponse.json({ error: 'HL7 message is required and must be a string.' }, { status: 400 });
    }

    // Note: In a production scenario, consider protecting this endpoint (e.g., API key, user session).
    // Supabase Edge Functions could also be an alternative for authenticated serverless functions.

    const parser = new HL7Parser();
    const result = parser.parse(rawHL7Message);

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Error parsing HL7 message via API:', error);
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    // If error is from request.json() failing (e.g. invalid JSON)
    if (error instanceof SyntaxError && error.message.toLowerCase().includes('json')) {
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

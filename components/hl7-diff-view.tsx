"use client"

import type { DiffResult, SegmentDiff } from "@/lib/hl7-diff";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface HL7DiffViewProps {
  diffResult: DiffResult | null;
}

const getRowClass = (type: SegmentDiff['type']) => {
  switch (type) {
    case 'added':
      return 'bg-green-100 dark:bg-green-900/30';
    case 'removed':
      return 'bg-red-100 dark:bg-red-900/30';
    case 'modified': // For future use
      return 'bg-yellow-100 dark:bg-yellow-900/30';
    default: // common
      return 'bg-slate-50 dark:bg-slate-800/20';
  }
};

const getTypeLabel = (type: SegmentDiff['type']) => {
  switch (type) {
    case 'added':
      return <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white">ADDED</Badge>;
    case 'removed':
      return <Badge variant="destructive">REMOVED</Badge>;
    case 'modified':
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600 dark:border-yellow-400 dark:text-yellow-400">MODIFIED</Badge>;
    case 'common':
      return <Badge variant="secondary">COMMON</Badge>;
    default:
      return <Badge variant="outline">{type.toUpperCase()}</Badge>;
  }
}

export function HL7DiffView({ diffResult }: HL7DiffViewProps) {
  if (!diffResult || diffResult.segments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Message Differences</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 dark:text-slate-400">
            No differences to display. Either both messages are identical at the segment level,
            or one or both messages were not provided or parsed correctly.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Message Differences</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {diffResult.segments.map((segmentDiff, index) => (
            <div
              key={index}
              className={`p-3 rounded-md border ${getRowClass(segmentDiff.type)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">{segmentDiff.segmentName}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    (Msg A Index: {segmentDiff.originalIndexA ?? 'N/A'}, Msg B Index: {segmentDiff.originalIndexB ?? 'N/A'})
                  </span>
                </div>
                {getTypeLabel(segmentDiff.type)}
              </div>

              {/* Display field-level differences for 'modified' or 'common' segments */}
              {(segmentDiff.type === 'modified' || segmentDiff.type === 'common') && segmentDiff.fieldDiffs && (
                <div className="mt-3 space-y-1 pl-4 border-l-2 border-slate-300 dark:border-slate-600">
                  {segmentDiff.fieldDiffs.map((fieldDiff, fIndex) => (
                    <div key={fIndex} className="py-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                          {segmentDiff.segmentName}-{fieldDiff.fieldIndex}
                        </span>
                        {fieldDiff.diffType === 'modified' && (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-600 dark:border-yellow-400 dark:text-yellow-400">MODIFIED</Badge>
                        )}
                        {fieldDiff.diffType === 'added' && (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white">ADDED TO B</Badge>
                        )}
                        {fieldDiff.diffType === 'removed' && (
                          <Badge variant="destructive">REMOVED FROM A</Badge>
                        )}
                         {fieldDiff.diffType === 'common' && (
                          <Badge variant="secondary">COMMON</Badge>
                        )}
                      </div>
                      {fieldDiff.diffType === 'modified' && (
                        <div className="grid grid-cols-2 gap-2 mt-1 text-xs font-mono">
                          <div className="p-1 bg-red-100 dark:bg-red-900/40 rounded">
                            <span className="font-semibold">A:</span> {fieldDiff.valueA}
                          </div>
                          <div className="p-1 bg-green-100 dark:bg-green-900/40 rounded">
                            <span className="font-semibold">B:</span> {fieldDiff.valueB}
                          </div>
                        </div>
                      )}
                      {fieldDiff.diffType === 'added' && (
                        <div className="mt-1 text-xs font-mono p-1 bg-green-100 dark:bg-green-900/40 rounded">
                          <span className="font-semibold">B:</span> {fieldDiff.valueB}
                        </div>
                      )}
                      {fieldDiff.diffType === 'removed' && (
                        <div className="mt-1 text-xs font-mono p-1 bg-red-100 dark:bg-red-900/40 rounded">
                           <span className="font-semibold">A:</span> {fieldDiff.valueA}
                        </div>
                      )}
                      {fieldDiff.diffType === 'common' && (
                         <div className="mt-1 text-xs font-mono p-1 bg-slate-100 dark:bg-slate-700/50 rounded">
                           {fieldDiff.valueA}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Display full segment content for 'added' or 'removed' segments */}
              {segmentDiff.type === 'added' && segmentDiff.fieldsB && (
                <pre className="mt-2 text-xs p-2 bg-green-50 dark:bg-green-950 rounded overflow-x-auto">
                  {segmentDiff.fieldsB.map(f => `${segmentDiff.segmentName}-${f.fieldIndex}: ${f.value}`).join('\n')}
                </pre>
              )}
              {segmentDiff.type === 'removed' && segmentDiff.fieldsA && (
                 <pre className="mt-2 text-xs p-2 bg-red-50 dark:bg-red-950 rounded overflow-x-auto">
                  {segmentDiff.fieldsA.map(f => `${segmentDiff.segmentName}-${f.fieldIndex}: ${f.value}`).join('\n')}
                </pre>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export interface ParsedFunction {
  kind: 'function';
  name: string;
  signature: string;
  description: string;
  params: Param[];
  returnType: string;
  returnDescription: string;
  lineNumber: number;
}

export interface ParsedInterface {
  kind: 'interface';
  name: string;
  description: string;
  properties: Prop[];
  lineNumber: number;
}

export interface ParsedType {
  kind: 'type';
  name: string;
  description: string;
  definition: string;
  lineNumber: number;
}

export interface ParsedClass {
  kind: 'class';
  name: string;
  description: string;
  methods: ParsedFunction[];
  properties: Prop[];
  lineNumber: number;
}

export interface ParsedEnum {
  kind: 'enum';
  name: string;
  description: string;
  members: string[];
  lineNumber: number;
}

export type ParsedExport = ParsedFunction | ParsedInterface | ParsedType | ParsedClass | ParsedEnum;

export interface ParseResult {
  exports: ParsedExport[];
  raw: string;
  language: string;
}

export interface Param {
  name: string;
  type: string;
  description: string;
  optional: boolean;
}

export interface Prop {
  name: string;
  type: string;
  description: string;
  optional: boolean;
}

export interface JSDocTags {
  example?: string[];
  throws?: string[];
  deprecated?: string | boolean;
  see?: string[];
  default?: string;
  readonly?: boolean;
  since?: string;
  experimental?: boolean;
}

export interface Param {
  name: string;
  type: string;
  description: string;
  optional: boolean;
  default?: string;
}

export interface Prop {
  name: string;
  type: string;
  description: string;
  optional: boolean;
  readonly?: boolean;
  default?: string;
}

export interface ParsedFunction {
  kind: 'function';
  name: string;
  signature: string;
  description: string;
  params: Param[];
  returnType: string;
  returnDescription: string;
  lineNumber: number;
  tags?: JSDocTags;
  isHook?: boolean;
  isComponent?: boolean;
  overloadIndex?: number;
  genericParams?: string[];
}

export interface ParsedInterface {
  kind: 'interface';
  name: string;
  description: string;
  properties: Prop[];
  methods?: ParsedFunction[];
  lineNumber: number;
  tags?: JSDocTags;
  genericParams?: string[];
  extends?: string[];
}

export interface ParsedType {
  kind: 'type';
  name: string;
  description: string;
  definition: string;
  lineNumber: number;
  tags?: JSDocTags;
  genericParams?: string[];
}

export interface ParsedClass {
  kind: 'class';
  name: string;
  description: string;
  methods: ParsedFunction[];
  properties: Prop[];
  constructorParams?: Param[];
  lineNumber: number;
  tags?: JSDocTags;
  genericParams?: string[];
  extends?: string[];
  implements?: string[];
  decorators?: string[];
}

export interface ParsedEnum {
  kind: 'enum';
  name: string;
  description: string;
  members: EnumMember[];
  lineNumber: number;
  tags?: JSDocTags;
}

export interface EnumMember {
  name: string;
  value?: string;
  description?: string;
}

export interface ParsedNamespace {
  kind: 'namespace';
  name: string;
  description: string;
  exports: ParsedExport[];
  lineNumber: number;
  tags?: JSDocTags;
}

export type ParsedExport =
  | ParsedFunction
  | ParsedInterface
  | ParsedType
  | ParsedClass
  | ParsedEnum
  | ParsedNamespace;

export interface ParseResult {
  exports: ParsedExport[];
  raw: string;
  language: string;
  warnings?: string[];
}

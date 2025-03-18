import BasePBCollection from "../../../core/typescript/pocketbase_interfaces";

interface INotesWorkspace extends BasePBCollection {
  icon: string;
  name: string;
}

interface INotesSubject extends BasePBCollection {
  workspace: string;
  description: string;
  icon: string;
  title: string;
}

interface INotesEntry extends BasePBCollection {
  name: string;
  path: string;
  subject: string;
  type: "file" | "folder";
  file: string;
}

interface INotesPath extends BasePBCollection {
  name: string;
}

export type { INotesEntry, INotesPath, INotesSubject, INotesWorkspace };

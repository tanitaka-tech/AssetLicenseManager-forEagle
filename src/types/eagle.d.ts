interface AddFromPathOptions {
  name?: string;
  website?: string;
  tags?: string[];
  folders?: string[];
  annotation?: string;
}

declare const eagle: {
  onPluginCreate: (callback: (plugin: unknown) => void) => void;
  onPluginShow: (callback: () => void) => void;
  onPluginHide?: (callback: () => void) => void;
  onPluginRun?: (callback: () => void) => void;
  onThemeChanged: (callback: (theme: string) => void) => void;
  app: {
    theme: string;
    isDarkColors: () => boolean;
  };
  item: {
    getSelected: () => Promise<EagleItem[]>;
    get: (options: {
      ids?: string[];
      folders?: string[];
      tags?: string[];
      ext?: string;
      keywords?: string[];
    }) => Promise<EagleItem[]>;
    addFromPath: (path: string, options: AddFromPathOptions) => Promise<string>;
  };
  folder: {
    getSelected: () => Promise<EagleFolder[]>;
    getAll: () => Promise<EagleFolder[]>;
    getById?: (id: string) => Promise<EagleFolder | null>;
  };
  shell: {
    openExternal: (url: string) => void;
    openPath: (path: string) => void;
  };
  contextMenu?: {
    open: (items: EagleContextMenuItem[]) => void;
  };
  os?: {
    tmpdir?: () => string;
  };
  library: {
    path: string;
    name?: string;
    modificationTime?: number;
    info?: () => Promise<{
      name: string;
      path: string;
      modificationTime?: number;
    }>;
  };
  plugin?: {
    path?: string;
    manifest?: { name?: string; version?: string };
  };
};

interface EagleFolder {
  id: string;
  name: string;
  description?: string;
  children?: EagleFolder[];
  modificationTime?: number;
  tags?: string[];
  imageCount?: number;
  descendantImageCount?: number;
  pinyin?: string;
  extendTags?: string[];
  password?: string;
  passwordTips?: string;
  parent?: string;
  save?: () => Promise<void>;
}

interface EagleItem {
  id: string;
  name: string;
  ext: string;
  size: number;
  url?: string;
  fileURL?: string;
  thumbnailURL?: string;
  filePath?: string;
  thumbnailPath?: string;
  width?: number;
  height?: number;
  tags: string[];
  folders: string[];
  isDeleted?: boolean;
  annotation?: string;
  modificationTime?: number;
  importedAt?: number;
  save?: () => Promise<void>;
  replaceFile?: (path: string) => Promise<void>;
}

interface EagleContextMenuItem {
  id?: string;
  label?: string;
  type?: "normal" | "separator";
  enabled?: boolean;
  visible?: boolean;
  click?: () => void;
  submenu?: EagleContextMenuItem[];
}

declare const i18next: {
  t: (key: string) => string;
};

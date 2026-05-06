declare const eagle: {
  onPluginCreate: (callback: (plugin: unknown) => void) => void;
  onThemeChanged: (callback: (theme: string) => void) => void;
  app: {
    theme: string;
    isDarkColors: () => boolean;
  };
  item: {
    getSelected: () => Promise<EagleItem[]>;
    get: (options: { ids?: string[]; folders?: string[] }) => Promise<
      EagleItem[]
    >;
  };
  folder: {
    getSelected: () => Promise<EagleFolder[]>;
    getAll: () => Promise<EagleFolder[]>;
  };
  shell: {
    openExternal: (url: string) => void;
    openPath: (path: string) => void;
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
}

declare const i18next: {
  t: (key: string) => string;
};

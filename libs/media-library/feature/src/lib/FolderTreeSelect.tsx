import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FolderOutlined } from '@ant-design/icons';
import { TreeSelect } from 'antd';
import { getMediaFolders } from '@creo/media-library-data-access';

interface FolderNode {
  id: string;
  name: string;
  parentId: string | null;
  pId: string;
  isLeaf: boolean;
}

export interface FolderTreeSelectProps {
  value?: string;
  onChange?: (folderId: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  rootLabel?: string;
}

const ROOT_KEY = '__root__';

export function FolderTreeSelect({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  rootLabel = 'Root',
}: FolderTreeSelectProps) {
  const [nodes, setNodes] = useState<FolderNode[]>([]);
  const loadedRef = useRef<Map<string, Promise<void>>>(new Map());

  const loadChildren = useCallback((parentId: string | null) => {
    const parentKey = parentId ?? ROOT_KEY;
    const existing = loadedRef.current.get(parentKey);
    if (existing) return existing;
    const promise = getMediaFolders(parentId ?? undefined).then((fetched) => {
      setNodes((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const incoming = fetched
          .filter((f) => !existingIds.has(f.id))
          .map<FolderNode>((f) => ({
            id: f.id,
            name: f.name,
            parentId: parentId ?? null,
            pId: parentKey,
            isLeaf: false,
          }));
        return incoming.length ? [...prev, ...incoming] : prev;
      });
    });
    loadedRef.current.set(parentKey, promise);
    return promise;
  }, []);

  useEffect(() => {
    void loadChildren(null);
  }, [loadChildren]);

  const treeData = useMemo(
    () =>
      nodes.map((n) => ({
        id: n.id,
        pId: n.pId,
        value: n.id,
        title: (
          <span>
            <FolderOutlined style={{ marginInlineEnd: 6 }} />
            {n.name}
          </span>
        ),
        isLeaf: n.isLeaf,
      })),
    [nodes],
  );

  const handleLoadData = (node: unknown) => {
    const id = (node as { id?: string }).id;
    return id ? loadChildren(id) : Promise.resolve();
  };

  return (
    <TreeSelect
      className={className}
      treeDataSimpleMode
      value={value}
      allowClear
      placeholder={placeholder ?? rootLabel}
      disabled={disabled}
      style={{ width: '100%' }}
      dropdownStyle={{ maxHeight: 320, overflow: 'auto' }}
      loadData={handleLoadData}
      treeData={treeData}
      onChange={(next) => onChange?.(next || undefined)}
      treeNodeFilterProp="name"
    />
  );
}

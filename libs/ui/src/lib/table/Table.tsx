import { useState, useCallback, useMemo } from 'react';
import { Table as AntTable, ConfigProvider, Checkbox, Dropdown, Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import type {
  TableProps as AntTableProps,
  TableColumnsType as AntTableColumnsType,
} from 'antd';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';
import './Table.module.scss';
import { useTheme } from '../theme';

export type TableColumnsType<T extends object = any> = AntTableColumnsType<T>;

export interface TableProps<T extends object = any> extends AntTableProps<T> {
  resizableColumns?: boolean;
  columnSettings?: boolean;
}

// ── Theme per mode ───────────────────────────────

function useTableTheme() {
  const { mode } = useTheme();
  return useMemo(() => {
    const isDark = mode === 'dark';
    return {
      components: {
        Table: {
          headerBg: isDark ? 'rgba(47, 188, 91, 0.06)' : 'rgba(47, 188, 91, 0.04)',
          headerColor: isDark ? 'rgba(233, 240, 245, 0.65)' : 'rgba(0, 0, 0, 0.65)',
          headerSplitColor: isDark ? 'rgba(47, 188, 91, 0.15)' : 'rgba(47, 188, 91, 0.2)',
          borderColor: isDark ? 'rgba(233, 240, 245, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          rowHoverBg: isDark ? 'rgba(47, 188, 91, 0.04)' : 'rgba(47, 188, 91, 0.03)',
          cellPaddingBlock: 16,
          cellPaddingInline: 16,
          fontSize: 13,
          headerBorderRadius: 0,
        },
        Pagination: {
          itemSize: 28,
          fontSize: 12,
          itemActiveBg: 'rgba(47, 188, 91, 0.12)',
        },
        Checkbox: {
          borderRadiusSM: 4,
          controlInteractiveSize: 14,
        },
        Dropdown: {
          borderRadiusLG: 6,
          borderRadiusSM: 4,
          controlItemBgHover: isDark ? 'rgba(233, 240, 245, 0.06)' : 'rgba(0, 0, 0, 0.04)',
          paddingBlock: 4,
        },
      },
    };
  }, [mode]);
}

const wrapperStyle: React.CSSProperties = {
  background: 'var(--creo-bg-container)',
  borderRadius: 8,
  border: '1px solid var(--creo-border-color-secondary)',
  overflow: 'hidden',
};

// ── Resizable header cell ─────────────────────────

interface ResizableTitleProps extends React.ThHTMLAttributes<HTMLTableHeaderCellElement> {
  onResize?: (e: React.SyntheticEvent, data: { size: { width: number } }) => void;
  width?: number;
}

function ResizableTitle({ onResize, width, ...rest }: ResizableTitleProps) {
  if (!width || !onResize) {
    return <th {...rest} />;
  }
  return (
    <Resizable
      width={width}
      height={0}
      handle={
        <span
          className="creo-resize-handle"
          onClick={(e) => e.stopPropagation()}
        />
      }
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...rest} />
    </Resizable>
  );
}

// ── Column settings dropdown ──────────────────────

interface ColumnSettingsProps {
  columns: { key?: React.Key; title?: React.ReactNode; dataIndex?: string | string[] }[];
  hiddenKeys: Set<string>;
  onToggle: (key: string) => void;
}

function ColumnSettings({ columns, hiddenKeys, onToggle }: ColumnSettingsProps) {
  const { mode } = useTheme();
  const iconColor = mode === 'dark' ? 'rgba(233, 240, 245, 0.45)' : 'rgba(0, 0, 0, 0.45)';

  const items = columns
    .filter((col) => col.title && typeof col.title === 'string')
    .map((col) => {
      const key = String(col.key || col.dataIndex);
      return {
        key,
        label: (
          <span
            style={{ display: 'flex', alignItems: 'center', gap: 8, userSelect: 'none' }}
            onClick={(e) => { e.stopPropagation(); onToggle(key); }}
          >
            <Checkbox checked={!hiddenKeys.has(key)} style={{ pointerEvents: 'none' }} />
            {String(col.title)}
          </span>
        ),
      };
    });

  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      <Button
        type="text"
        size="small"
        icon={<SettingOutlined />}
        style={{ color: iconColor }}
      />
    </Dropdown>
  );
}

// ── Table component ───────────────────────────────

export function Table<T extends object = any>({
  columns: propColumns,
  resizableColumns = false,
  columnSettings = false,
  pagination,
  ...rest
}: TableProps<T>) {
  const tableTheme = useTableTheme();
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());

  const handleResize = useCallback(
    (key: string) =>
      (_: React.SyntheticEvent, { size }: { size: { width: number } }) => {
        setColumnWidths((prev) => ({ ...prev, [key]: size.width }));
      },
    []
  );

  const toggleColumn = useCallback((key: string) => {
    setHiddenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const processedColumns = useMemo(() => {
    if (!propColumns) return propColumns;

    const cols = propColumns.map((col: any) => {
      const key = String(col.key || col.dataIndex);
      const width = columnWidths[key] ?? col.width;
      const isActionsCol = columnSettings && key === 'actions';

      return {
        ...col,
        width,
        hidden: hiddenKeys.has(key) ? true : col.hidden,
        ...(isActionsCol
          ? {
              title: (
                <ColumnSettings
                  columns={propColumns as any[]}
                  hiddenKeys={hiddenKeys}
                  onToggle={toggleColumn}
                />
              ),
            }
          : {}),
        ...(resizableColumns && width
          ? { onHeaderCell: () => ({ width, onResize: handleResize(key) }) }
          : {}),
      };
    });

    return cols;
  }, [propColumns, columnWidths, hiddenKeys, resizableColumns, columnSettings, handleResize, toggleColumn]);

  const dataCount = (rest.dataSource?.length) ?? 0;
  const mergedPagination = pagination === false
    ? false
    : {
        size: 'small' as const,
        align: 'center' as const,
        showSizeChanger: false,
        hideOnSinglePage: true,
        defaultPageSize: 25,
        ...((typeof pagination === 'object' ? pagination : {}) as object),
        ...(dataCount <= 25 ? { hideOnSinglePage: true } : {}),
      };

  return (
    <ConfigProvider theme={tableTheme}>
      <div style={wrapperStyle}>
        <AntTable<T>
          showSorterTooltip={false}
          columns={processedColumns}
          pagination={mergedPagination}
          {...rest}
          {...(resizableColumns
            ? { components: { ...rest.components, header: { cell: ResizableTitle } } }
            : {})}
        />
      </div>
    </ConfigProvider>
  );
}

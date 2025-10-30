import { TableHead } from '@/components/ui/table';
import IconArrowsSort from '@/assets/tabler-icons/IconArrowsSort';
import { ReactNode } from 'react';
import IconArrowsSortDown from '@/assets/tabler-icons/IconArrowsSortDown';
import IconArrowsSortUp from '@/assets/tabler-icons/IconArrowsSortUp';

type SortState = 'asc' | 'desc';

const TableSortFields = ({
  sortState,
  onChange,
  children,
}: {
  sortState?: SortState;
  onChange: () => void;
  children: ReactNode;
}) => {
  return (
    <TableHead className="cursor-pointer select-none" onClick={() => onChange()}>
      <div className="flex items-center gap-1 ">
        <span>{children}</span>
        {sortState === 'asc' ? (
          <IconArrowsSortUp />
        ) : sortState === 'desc' ? (
          <IconArrowsSortDown />
        ) : (
          <IconArrowsSort />
        )}
      </div>
    </TableHead>
  );
};

export default TableSortFields;

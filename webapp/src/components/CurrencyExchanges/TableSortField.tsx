import { TableHead } from '@/components/ui/table.tsx';
import IconArrowsSort from '@/assets/tabler-icons/IconArrowsSort.tsx';
import { ReactNode } from 'react';
import IconArrowsSortDown from '@/assets/tabler-icons/IconArrowsSortDown.tsx';
import IconArrowsSortUp from '@/assets/tabler-icons/IconArrowsSortUp.tsx';

type SortState = 'asc' | 'desc' | 'none';

const TableSortFields = ({
  sortState,
  onChange,
  children,
}: {
  sortState: SortState;
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

import {AlertTriangle, Search, X} from "lucide-react";
import {trpc} from "@/lib/trpc.ts";
import CurrencyExchangesTable from "@/components/CurrencyExchanges/CurrencyExchangesTable.tsx";
import {useEffect, useState} from "react";
import {Input} from "@/components/ui/input.tsx";
import {Button} from "@/components/ui/button.tsx";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select.tsx";

type SortItem = 'asc' | 'desc' | 'none';
type SortItemName = 'position' | 'inProgress' | 'remains' | 'minTransactionAmount' | 'deadline';
type SortStates = Record<SortItemName, SortItem>

type StatusFilter = 'draft' | 'in_progress' | 'finished' | 'cancelled';

const AllCurrencyExchangesPage = () => {
    const [sortStates, setSortStates] = useState<SortStates>({
        position: 'asc',
        inProgress: 'none',
        remains: 'none',
        minTransactionAmount: 'none',
        deadline: 'none',
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('in_progress');

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        // setCurrentPage(1);
    };

    const currentSortItem = Object
        .entries(sortStates)
        .find(
            ([, value]) => value !== 'none'
        );

    let sortBy: SortItemName | undefined = undefined;
    let sortOrder: SortItem | undefined = undefined;

    if (currentSortItem) {
        sortBy = currentSortItem[0];
        sortOrder = currentSortItem[1];
    }

    const {
        data: combinationsData,
    } = trpc.currencyExchange.getAllCombinations.useQuery();
    const currencyExchangeCombinations = combinationsData?.combinations;
    const [selectedCombination, setSelectedCombination] = useState<string | undefined>();
    const handleSelectCombination = (value: string) => {
        setSelectedCombination(value);
    }

    useEffect(() => {
        if (currencyExchangeCombinations?.length) {
            setSelectedCombination(
                `${currencyExchangeCombinations[0].fromCurrency.id}|${currencyExchangeCombinations[0].toCurrency.id}`
            );
        }
    }, [currencyExchangeCombinations]);

    const {
        data: currencyExchangesData,
        isLoading,
        error,
    } = trpc.currencyExchange.getAll.useQuery({
        status: statusFilter,
        fromCurrencyId: selectedCombination?.split('|')[0],
        toCurrencyId: selectedCombination?.split('|')[1],
        search: debouncedSearchTerm || undefined,
        sortBy: sortBy,
        sortOrder: sortOrder !== 'none' ? sortOrder : undefined,
    });

    const currencyExchanges = currencyExchangesData?.currencyExchanges || [];

    const handleStatusFilterChange = (status: StatusFilter) => {
        setStatusFilter(status);
    }

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    if (error) {
        return (
            <div className="p-6">
                <div className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Error loading orders: {error.message}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="grid gap-6 p-6">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 sm:items-end">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
                    <Select
                        value={selectedCombination}
                        onValueChange={handleSelectCombination}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select an exchange combination" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {currencyExchangeCombinations?.map((combination, index) => (
                                    <SelectItem
                                        key={index}
                                        value={`${combination.fromCurrency.id}|${combination.toCurrency.id}`}
                                    >
                                        {combination.fromCurrency.name} → {combination.toCurrency.name}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Search"
                            value={searchTerm}
                            onChange={e => handleSearchChange(e.target.value)}
                            className="pl-10 pr-10"
                        />
                        {searchTerm && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-9 w-9 p-0"
                                onClick={() => handleSearchChange('')}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                <div className="h-full flex gap-2 items-center">
                    <Select
                        defaultValue={statusFilter}
                        onValueChange={(status: StatusFilter) => handleStatusFilterChange(status)}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Status Filter</SelectLabel>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="in_progress">In progress</SelectItem>
                                <SelectItem value="finished">Finished</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            {isLoading ? (
                <div className="flex justify-center items-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : currencyExchanges.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    No currency exchanges found matching your criteria.
                </div>
            ) : (
                <>
                    {/* Desktop Table View */}
                    <div className="hidden lg:block text-gray-400">
                        <div className="overflow-x-auto rounded-md border border-muted">
                            <CurrencyExchangesTable
                                currencyExchanges={currencyExchanges}
                                sortStates={sortStates}
                                setSortStates={setSortStates}
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AllCurrencyExchangesPage;
import {FormControl, FormField, FormItem, FormMessage} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger} from "@/components/ui/select.tsx";
import {SelectValue} from "@radix-ui/react-select";
import {Label} from "@/components/ui/label.tsx";
import {trpc} from "@/lib/trpc.ts";
import {UseFormReturn} from "react-hook-form";

interface CurrencyExchange {
    exchangeRate?: number,
    amount?: number,
    amountInSelectedCurrencyFrom?: number,
    amountInSelectedCurrencyTo?: number,
    deadline?: Date,
    minTransactionAmount?: number,
    orderItemId?: string,
    fromCurrencyId?: string,
    toCurrencyId?: string,
}

type FieldName = "exchangeRate" | "amount" | "amountInSelectedCurrencyFrom" | "amountInSelectedCurrencyTo" | "deadline" | "minTransactionAmount" | "orderItemId" | "fromCurrencyId" | "toCurrencyId";

type CurrenciesSelectionRowProps = {
    form: UseFormReturn<any>
    currencyExchange: CurrencyExchange
    handleBlur: (fieldName: FieldName, value?: any) => void
    handleChange: (field: any, value: string) => void
    handleAmountInSelectedCurrencyToBlur: (value: number) => void
}

const CurrenciesSelectionRow = ({
    form,
    currencyExchange,
    handleBlur,
    handleChange,
    handleAmountInSelectedCurrencyToBlur,
} : CurrenciesSelectionRowProps) => {
    const {
        data: currenciesData,
        error: currenciesError,
        isLoading: currenciesLoading,
    } = trpc.currency.getAll.useQuery({
        search: "",
    });

    return (
        <div className="flex flex-wrap justify-start items-center gap-6">

            {/* From currency */}
            <div>
                <Label htmlFor="from-currency-select" className="mb-2">
                    From
                </Label>
                <div className="flex flex-wrap gap-1.5">
                    <div>
                        <FormField
                            name="fromCurrencyId"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl className="md:min-w-52">
                                        <Select
                                            defaultValue={field.value}
                                            key={`from-currency-${field.value}`}
                                            value={field.value}
                                            onValueChange={value => {
                                                field.onChange(value);
                                                handleBlur(field.name);
                                            }}
                                            name={field.name}
                                        >
                                            <SelectTrigger className="md:min-w-52">
                                                <SelectValue placeholder="Select from currency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {
                                                    currenciesLoading ? (
                                                        <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading...</div>
                                                    ) : currenciesError ? (
                                                        <div className="px-2 py-1.5 text-sm text-destructive">
                                                            Error loading currencies
                                                        </div>
                                                    ) : currenciesData?.currencies?.length === 0 ? (
                                                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                            No currencies available
                                                        </div>
                                                    ) : (
                                                        currenciesData?.currencies?.map((currency: {
                                                            id: string,
                                                            name: string
                                                        }) => (
                                                            <SelectItem
                                                                key={currency.id}
                                                                disabled={currency.id === currencyExchange.toCurrencyId}
                                                                value={currency.id}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    {currency.name}
                                                                </div>
                                                            </SelectItem>
                                                        ))
                                                    )}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="flex flex-col gap-3">
                        <FormField
                            name="amountInSelectedCurrencyFrom"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input
                                            placeholder="Amount"
                                            value={field.value || ''}
                                            onChange={e => handleChange(field, e.target.value)}
                                            onBlur={() => handleBlur(field.name, Number.parseInt(field.value))}
                                            name={field.name}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* To currency */}
            <div>
                <Label htmlFor="to-currency-select" className="mb-2">
                    To
                </Label>
                <div className="flex flex-wrap gap-1.5">
                    <div>
                        <FormField
                            name="toCurrencyId"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl className="md:min-w-52">
                                        <Select
                                            defaultValue={field.value}
                                            key={`to-currency-${field.value}`}
                                            value={field.value}
                                            onValueChange={value => {
                                                field.onChange(value);
                                                handleBlur(field.name);
                                            }}
                                            name={field.name}
                                        >
                                            <SelectTrigger className="md:min-w-52">
                                                <SelectValue placeholder="Select to currency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {
                                                    currenciesLoading ? (
                                                        <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading...</div>
                                                    ) : currenciesError ? (
                                                        <div className="px-2 py-1.5 text-sm text-destructive">
                                                            Error loading currencies
                                                        </div>
                                                    ) : currenciesData?.currencies?.length === 0 ? (
                                                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                            No currencies available
                                                        </div>
                                                    ) : (
                                                        currenciesData?.currencies?.map((currency: {
                                                            id: string,
                                                            name: string
                                                        }) => (
                                                            <SelectItem
                                                                key={currency.id}
                                                                disabled={currency.id === currencyExchange.fromCurrencyId}
                                                                value={currency.id}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    {currency.name}
                                                                </div>
                                                            </SelectItem>
                                                        ))
                                                    )}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="flex flex-col gap-3">
                        <FormField
                            name="amountInSelectedCurrencyTo"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input
                                            placeholder="Amount"
                                            value={field.value || ''}
                                            onChange={e => handleChange(field, e.target.value)}
                                            onBlur={() => handleAmountInSelectedCurrencyToBlur(Number.parseInt(field.value))}
                                            name={field.name}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* Exchange rate */}
            <div>
                {(currencyExchange.fromCurrencyId && currencyExchange.toCurrencyId) ? (
                    <Label htmlFor="exchange-rate-input" className="mb-2">
                        Exchange Rate: {
                            currenciesData?.currencies?.find((currency: {
                                id: string,
                                name: string
                            }) => currency.id == currencyExchange.fromCurrencyId)?.name
                        } to {
                        currenciesData?.currencies?.find((currency: {
                            id: string,
                            name: string
                        }) => currency.id == currencyExchange.toCurrencyId)?.name
                    }
                    </Label>
                ) : (
                    <Label htmlFor="date-picker" className="mb-2">
                        Exchange Rate
                    </Label>
                )}
                <div className="flex flex-wrap gap-1.5">
                    <div className="flex flex-col gap-3">
                        <FormField
                            name="exchangeRate"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input
                                            placeholder="Exchange Rate"
                                            value={field.value || ''}
                                            onChange={e => handleChange(field, e.target.value)}
                                            onBlur={() => handleBlur(field.name, Number.parseInt(field.value))}
                                            name={field.name}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CurrenciesSelectionRow;
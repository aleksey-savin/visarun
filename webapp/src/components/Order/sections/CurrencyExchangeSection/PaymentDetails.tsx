import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { UseFormReturn } from 'react-hook-form';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CurrencyExchange {
  position: number;
  exchangeRate?: number;
  amountInSelectedCurrencyFrom?: number;
  amountInSelectedCurrencyTo?: number;
  deadline?: Date;
  minTransactionAmountInSelectedCurrency?: number;
  orderItemId?: string;
  fromCurrencyId?: string;
  toCurrencyId?: string;
}

type PaymentDetailsProps = {
  form: UseFormReturn<any>;
  currencyExchange: CurrencyExchange;
  setCurrencyExchange: (newCurrencyExchange: CurrencyExchange) => void;
  paymentType: string;
  setPaymentType: (newPaymentType: string) => void;
  handleBlur: (fieldName: FieldName, value?: any) => void;
  handleChange: (field: any, value: string) => void;
};

type FieldName =
  | 'exchangeRate'
  | 'amountInSelectedCurrencyFrom'
  | 'amountInSelectedCurrencyTo'
  | 'deadline'
  | 'minTransactionAmountInSelectedCurrency'
  | 'orderItemId'
  | 'fromCurrencyId'
  | 'toCurrencyId';

const PaymentDetails = ({
  form,
  paymentType,
  setPaymentType,
  currencyExchange,
  setCurrencyExchange,
  handleChange,
  handleBlur,
}: PaymentDetailsProps) => {
  const [deadlineDateOpen, setDeadlineDateOpen] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(
    currencyExchange.deadline ? new Date(currencyExchange.deadline) : undefined
  );
  const [deadlineTime, setDeadlineTime] = useState<string>(
    currencyExchange.deadline
      ? new Date(currencyExchange.deadline).toTimeString().slice(0, 5)
      : '00:00'
  );

  const handleDeadlineDateUpdate = (date: Date | undefined) => {
    if (date) setDeadlineDate(date);

    saveDeadline();
  };

  const handleDeadlineTimeUpdate = (time: string) => {
    setDeadlineTime(time);
  };

  const saveDeadline = () => {
    if (!deadlineDate) {
      return setCurrencyExchange({
        ...currencyExchange,
        deadline: undefined,
      });
    }

    const [hours, minutes] = deadlineTime.split(':').map(Number);
    const combinedDate = new Date(deadlineDate);
    combinedDate.setHours(hours, minutes, 0, 0);

    return setCurrencyExchange({
      ...currencyExchange,
      deadline: combinedDate,
    });
  };

  const [deadlineIndefinitely, setDeadlineIndefinitely] = useState(false);
  const handleDeadlineIndefinitely = () => {
    setDeadlineIndefinitely(prevState => {
      if (!prevState) {
        setCurrencyExchange({
          ...currencyExchange,
          deadline: undefined,
        });
      } else {
        saveDeadline();
      }

      return !prevState;
    });
  };

  const handlePaymentTypeChange = (value: string) => {
    if (value == 'full' && currencyExchange.amountInSelectedCurrencyTo) {
      // When "full" type selected minTransactionAmountInSelectedCurrency = amountInSelectedCurrencyTo

      setCurrencyExchange({
        ...currencyExchange,
        minTransactionAmountInSelectedCurrency: currencyExchange.amountInSelectedCurrencyTo,
      });
    } else if (value == 'partial') {
      // When "partial" type selected minTransactionAmountInSelectedCurrency = minTransactionAmount input value

      setCurrencyExchange({
        ...currencyExchange,
        minTransactionAmountInSelectedCurrency: minTransactionAmountInSelectedCurrency
          ? Number.parseInt(minTransactionAmountInSelectedCurrency)
          : undefined,
      });
    }

    setPaymentType(value);
  };

  const [minTransactionIndefinitely, setMinTransactionIndefinitely] = useState(false);
  const [minTransactionAmountInSelectedCurrency, setMinTransactionAmountInSelectedCurrency] =
    useState<string | undefined>();
  const handleMinTransactionIndefinitely = () => {
    setMinTransactionIndefinitely(prevState => {
      if (!prevState) {
        setCurrencyExchange({
          ...currencyExchange,
          minTransactionAmountInSelectedCurrency: undefined,
        });
      } else {
        setCurrencyExchange({
          ...currencyExchange,
          minTransactionAmountInSelectedCurrency: minTransactionAmountInSelectedCurrency
            ? Number.parseInt(minTransactionAmountInSelectedCurrency)
            : undefined,
        });
      }

      return !prevState;
    });
  };

  return (
    <>
      {/*Tabs Partial or Full*/}
      <div className="flex flex-wrap justify-start items-center gap-6">
        <div>
          <Label className="mb-2 text-muted">Payment to client details:</Label>
          <div>
            <Tabs
              defaultValue="partial"
              className="w-[400px]"
              onValueChange={handlePaymentTypeChange}
            >
              <TabsList>
                <TabsTrigger value="partial">Partial</TabsTrigger>
                <TabsTrigger value="full">Full</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/*Minimal transaction*/}
      <div className="flex flex-wrap justify-start items-center gap-6">
        {paymentType == 'partial' && (
          <div>
            <Label htmlFor="min-transaction-input" className="mb-2">
              Minimal transaction
            </Label>
            <div className="flex flex-wrap gap-1.5">
              <div className="flex flex-col gap-3">
                <FormField
                  name="minTransactionAmountInSelectedCurrency"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="Minimal transaction"
                          value={field.value || ''}
                          disabled={minTransactionIndefinitely}
                          onChange={e => {
                            handleChange(field, e.target.value);
                            setMinTransactionAmountInSelectedCurrency(e.target.value);
                          }}
                          onBlur={() => handleBlur(field.name, Number.parseInt(field.value))}
                          name={field.name}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-2 items-center">
                <Switch
                  checked={minTransactionIndefinitely}
                  onCheckedChange={handleMinTransactionIndefinitely}
                />
                <Label>Indefinitely</Label>
              </div>
            </div>
          </div>
        )}

        {/*Deadline*/}
        <div>
          <Label htmlFor="deadline-picker" className="mb-2">
            Payment deadline
          </Label>
          <div className="flex flex-wrap gap-1.5">
            <div className="flex flex-col gap-3">
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Popover open={deadlineDateOpen} onOpenChange={setDeadlineDateOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            disabled={deadlineIndefinitely}
                            variant="secondary"
                            id="deadline-picker"
                            className={cn(
                              'min-w-52 justify-between',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {deadlineDate ? deadlineDate.toLocaleDateString() : 'Select date'}
                            <CalendarIcon />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={deadlineDate}
                            captionLayout="dropdown"
                            onSelect={date => handleDeadlineDateUpdate(date)}
                            disabled={date => {
                              const today = new Date();
                              return date < today;
                            }}
                            startMonth={new Date()}
                            endMonth={new Date(2100, 11)}
                          />
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="flex flex-col gap-3">
              <Input
                type="time"
                value={deadlineTime}
                onChange={e => {
                  handleDeadlineTimeUpdate(e.target.value);
                }}
                onBlur={() => {
                  saveDeadline();
                }}
                disabled={deadlineIndefinitely}
                className={cn(
                  deadlineTime ? '' : 'text-secondary',
                  'bg-secondary appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
                )}
              />
            </div>
            <div className="flex gap-2 items-center">
              <Switch checked={deadlineIndefinitely} onCheckedChange={handleDeadlineIndefinitely} />
              <Label>Indefinitely</Label>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentDetails;

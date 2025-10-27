import {trpc} from "@/lib/trpc.ts";
import useOrderStore, {StoreClient, StoreCurrencyExchange} from "@/stores/order/order-store.ts";
import {Button} from "@/components/ui/button.tsx";

const AddExchangeButton = ({
    client,
    disabled,
    setActiveService
}: {
    client: StoreClient,
    disabled: boolean,
    setActiveService: (type: string) => void,
}) => {
    const {
        orderItems,
        setOrderItems,
        setSaveStatus,
        order,
        setCurrencyExchanges,
        currencyExchanges,
    } = useOrderStore();

    const clientOrderItems = (orderItems?.filter(item => item.clientId === client.id && item.serviceType === "currencyExchange") || []);

    const createOrderItemMutation = trpc.orderItem.create.useMutation();

    const handleAddCurrencyExchange = async () => {
        setSaveStatus('saving');

        const newData = await createOrderItemMutation.mutateAsync({
            orderId: order.id || '',
            clientId: client.id,
            serviceType: 'currencyExchange',
            basePrice: 0,
            finalPrice: 0,
        });

        if (!newData.orderItem) {
            console.error('Order item was not created');
            setSaveStatus('error');
            return;
        }

        setOrderItems([
            ...orderItems,
            {
                ...newData.orderItem,
                createdAt: new Date(newData.orderItem.createdAt),
                updatedAt: new Date(newData.orderItem.updatedAt),
            },
        ]);

        // Add proper null check
        if (!newData.currencyExchange) {
            console.error('Currency exchange was not created');
            setSaveStatus('error');
            return;
        }

        setCurrencyExchanges([
            ...currencyExchanges,
            {
                ...newData.currencyExchange,
                id: newData.currencyExchange.id,
                orderItemId: newData.currencyExchange.orderItemId,
                status: newData.currencyExchange.status,
                createdAt: newData.currencyExchange.createdAt
                    ? new Date(newData.currencyExchange.createdAt)
                    : null,
                updatedAt: newData.currencyExchange.updatedAt
                    ? new Date(newData.currencyExchange.updatedAt)
                    : null,
            } as StoreCurrencyExchange,
        ]);

        setSaveStatus('saved');
    };

    const handleClick = async () => {
        setActiveService("currencyExchange");

        if (clientOrderItems.length !== 0) return;

        await handleAddCurrencyExchange();
    }

    return (
        <Button
            disabled={disabled}
            onClick={() => handleClick()}
            variant="secondary"
            size="sm"
            className="border-none"
        >
            + Currency Exchange
        </Button>
    )
};

export default AddExchangeButton;
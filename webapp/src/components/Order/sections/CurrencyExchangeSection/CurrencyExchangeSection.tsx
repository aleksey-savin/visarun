import {Card} from "@/components/ui/card.tsx";
import CurrencyExchangeCard from "@/components/Order/sections/CurrencyExchangeSection/CurrencyExchangeCard.tsx";
import useOrderStore, {StoreClient} from "@/stores/order/order-store.ts";

const CurrencyExchangeSection = ({ client }: { client: StoreClient }) => {
    const {orderItems, currencyExchanges} = useOrderStore();

    const clientOrderItemsWithCurrencyExchange = (
        orderItems
            ?.filter(item => item.clientId === client.id && item.serviceType == "currencyExchange") || [])
            .sort((a, b) => b.id.localeCompare(a.id)
    );

    return (
        <Card className="border-none p-4 gap-10">
            <div>Exchange</div>

            {clientOrderItemsWithCurrencyExchange
                ?.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                .map((orderItem, index) => {
                    const currencyExchange =
                        currencyExchanges?.find(exchange => exchange.orderItemId === orderItem.id);

                    if (!currencyExchange) return;

                    return(
                        <CurrencyExchangeCard key={index} savedExchange={currencyExchange} client={client} orderItem={orderItem} />
                    )
                })
            }
        </Card>
    );
}

export default CurrencyExchangeSection;
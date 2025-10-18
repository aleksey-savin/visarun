import {Card} from "@/components/ui/card.tsx";
import CurrencyExchangeCard from "@/components/Order/sections/CurrencyExchangeSection/CurrencyExchangeCard.tsx";
import useOrderStore, {StoreClient} from "@/stores/order/order-store.ts";

const CurrencyExchangeSection = ({ client }: { client: StoreClient }) => {
    const {orderItems, currencyExchanges} = useOrderStore();

    const clientOrderItems = (
        orderItems
            ?.filter(item => item.clientId === client.id && item.serviceType == "currencyExchange") || [])
            .sort((a, b) => b.id.localeCompare(a.id)
    );

    // console.log(clientOrderItems, currencyExchanges);

    const clientCurrencyExchanges = currencyExchanges.filter(ex =>
        clientOrderItems.some(item => item.id === ex.orderItemId)
    );

    return (
        <Card className="border-none p-4 gap-10">
            <div>Exchange</div>

            {clientCurrencyExchanges
                ?.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                .map((exchange, index) =>
                    <CurrencyExchangeCard key={index} savedExchange={exchange} client={client} />
                )
            }
        </Card>
    );
}

export default CurrencyExchangeSection;
import { currencyExchangeReadProcedure } from '../../lib/trpc';

export const getAllCurrencyExchangeCombinationsTrpcRoute = currencyExchangeReadProcedure.query(
  async ({ ctx }) => {
    let exchanges = await ctx.prisma.currencyExchange.findMany({
      select: {
        status: true,
        fromCurrency: {
          select: {
            id: true,
            name: true,
            isBegottening: true,
          },
        },
        toCurrency: {
          select: {
            id: true,
            name: true,
            isBegottening: true,
          },
        },
      },
    });

    exchanges = exchanges.filter(
      ex =>
        ex.fromCurrency &&
        ex.toCurrency &&
        ex.fromCurrency.id &&
        ex.toCurrency.id &&
        ex.status !== 'draft'
    );

    const uniquePairs = new Set<string>(
      exchanges.map(
        e =>
          `${e.fromCurrency!.id}|${e.fromCurrency!.name}|${e.fromCurrency!.isBegottening}_${e.toCurrency!.id}|${e.toCurrency!.name}|${e.toCurrency!.isBegottening}`
      )
    );

    const result = Array.from(uniquePairs).map(pair => {
      const [fromCurrency, toCurrency] = pair.split('_');
      const [fromCurrencyId, fromCurrencyName, fromCurrencyIsBegottening] = fromCurrency.split('|');
      const [toCurrencyId, toCurrencyName, toCurrencyIsBegottening] = toCurrency.split('|');

      return {
        fromCurrency: {
          id: fromCurrencyId,
          name: fromCurrencyName,
          isBegottening: fromCurrencyIsBegottening === 'true',
        },
        toCurrency: {
          id: toCurrencyId,
          name: toCurrencyName,
          isBegottening: toCurrencyIsBegottening === 'false',
        },
      };
    });

    return {
      combinations: Array.from(result),
    };
  }
);

/*
TODO:
    Add permission in transactionUpdateProcedure
 */

import { transactionUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditTransactionTrpcInput = z.object({
    id: z.string().uuid(),
    amountInSelectedCurrency: z.number().positive().optional(),
    checkUrl: z.string().optional(),
    senderId: z.string().uuid().optional(),
    isInCash: z.boolean().optional(),
    detailsSent: z.boolean().optional(),
    paymentConfirmed: z.boolean().optional(),
    clientsInformed: z.boolean().optional(),
    paymentCompleted: z.boolean().optional(),
});

export const editTransactionTrpcRoute = transactionUpdateProcedure
    .input(zEditTransactionTrpcInput)
    .mutation(async ({ input, ctx }) => {
        const { id, detailsSent, paymentConfirmed, clientsInformed, paymentCompleted, ...updateData } = input;

        if (!ctx.user?.id) {
            throw new Error("User must be authenticated to edit the Transaction");
        }

        // Check if transaction exists
        const existingTransaction = await ctx.prisma.transaction.findUnique({
            where: { id },
            select: {
                status: true,
                senderId: true,
                checkUrl: true,
                amountInSelectedCurrency: true,
                isCompanyTransaction: true,
                currencyExchange: {
                    select: {
                        amountInSelectedCurrencyTo: true,
                        minTransactionAmountInSelectedCurrency: true,
                        transactions: {
                            where: {
                                id: { not: id }
                            },
                            select: {
                                amountInSelectedCurrency: true,
                            },
                        },
                    },
                },
            },
        });

        if (!existingTransaction) {
            throw new Error('Transaction not found');
        }

        // Transactions sum validation (must be smaller than exchange amount)
        if (existingTransaction.currencyExchange.amountInSelectedCurrencyTo && input.amountInSelectedCurrency) {
            type Transaction = { amountInSelectedCurrency: string }

            if (existingTransaction.currencyExchange.amountInSelectedCurrencyTo < existingTransaction.currencyExchange.transactions.reduce(
                (acc: number, curr: Transaction) => acc + parseInt(curr.amountInSelectedCurrency), 0) + input.amountInSelectedCurrency
            ) {
                throw new Error("Transactions sum must be smaller than exchange amount (in selected currency)");
            }
        }

        // Amount validation (must be greater than minTransactionAmount in CurrencyExchange)
        if (input.amountInSelectedCurrency && existingTransaction.currencyExchange.minTransactionAmountInSelectedCurrency) {
            if (input.amountInSelectedCurrency < existingTransaction.currencyExchange.minTransactionAmountInSelectedCurrency) {
                throw new Error("Amount must be greater than minTransactionAmount in CurrencyExchange (in selected currency)");
            }
        }

        // Sender existence validation
        if (input.senderId) {
            const sender = await ctx.prisma.client.findUnique({
                where: { id: input.senderId },
            });

            if (!sender) {
                throw new Error("Sender does not exist");
            }
        }

        // Statuses
        updateData.status = existingTransaction.status;

        // console.log(existingTransaction.status, existingTransaction.isCompanyTransaction, input)

        //draft -> check_uploaded (company transaction)
        if (
            existingTransaction.status === 'draft'
            && existingTransaction.isCompanyTransaction === true
            && input.checkUrl
            && input.senderId
            && input.amountInSelectedCurrency
        ) {
            updateData.status = 'check_uploaded';
        }

        //draft -> details_sent (not company transaction)
        if (
            existingTransaction.status === 'draft'
            && existingTransaction.isCompanyTransaction === false
            && input.detailsSent === true //button "details_sent" clicked
            && !input.checkUrl
            && input.amountInSelectedCurrency
        ) {
            updateData.status = 'details_sent';
        }

        //draft -> check_uploaded (not company transaction)
        if (
            existingTransaction.status === 'draft'
            && existingTransaction.isCompanyTransaction === false
            && input.checkUrl
            && input.amountInSelectedCurrency
        ) {
            updateData.status = 'check_uploaded';
        }

        //details_sent -> draft (not company transaction)
        if (
            existingTransaction.status === 'details_sent'
            && existingTransaction.isCompanyTransaction === false
            && input.detailsSent === false //button "details_sent" unclicked
            && !input.checkUrl
        ) {
            updateData.status = 'draft';
        }

        //check_uploaded -> draft (company transaction)
        if (
            existingTransaction.status === 'check_uploaded'
            && existingTransaction.isCompanyTransaction === true
            && !input.checkUrl
        ) {
            updateData.status = 'draft';
        }

        //check_uploaded -> paid_uninformed
        if (
            existingTransaction.status === 'check_uploaded'
            && input.paymentConfirmed === true //button "confirm_payment" clicked
        ) {
            updateData.status = 'paid_uninformed';
        }

        //paid_uninformed -> paid_informed
        if (
            existingTransaction.status === 'paid_uninformed'
            && input.clientsInformed === true //switch "informed" checked
        ) {
            updateData.status = 'paid_informed';
        }

        //paid_informed -> paid_uninformed
        if (
            existingTransaction.status === 'paid_informed'
            && input.clientsInformed === false //switch "informed" unchecked
        ) {
            updateData.status = 'paid_uninformed';
        }

        //paid_informed -> completed
        if (
            existingTransaction.status === 'paid_informed'
            && input.paymentCompleted // button "payment completed" clicked
        ) {
            updateData.status = 'completed';
        }

        // amountInSelectedCurrency and senderId can be modified only in draft status
        if (['details_sent', 'check_uploaded', 'paid_uninformed', 'paid_informed', 'completed'].includes(updateData.status)) {
            updateData.amountInSelectedCurrency = undefined;
            updateData.senderId = undefined;
        }

        // isInCash can be modified only in draft and details_sent status
        if (['check_uploaded', 'paid_uninformed', 'paid_informed', 'completed'].includes(updateData.status)) {
            updateData.isInCash = undefined;
        }

        // checkUrl can be modified only in draft, details_sent and check_uploaded status
        if (['paid_uninformed', 'paid_informed', 'completed'].includes(updateData.status)) {
            updateData.checkUrl = undefined;
        }

        // Update transaction
        const transaction = await ctx.prisma.transaction.update({
            where: { id },
            data: {
                ...updateData,
                updatedById: ctx.user.id,
            },
        });

        return { transaction };
    });

import { requirementReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zValidateRequirementInputTrpcInput = z.object({
  requirementId: z.string().uuid(),
  inputValue: z.union([z.string(), z.number(), z.boolean(), z.date()]),
});

export const validateRequirementInputTrpcRoute = requirementReadProcedure
  .input(zValidateRequirementInputTrpcInput)
  .query(async ({ input, ctx }) => {
    const { requirementId, inputValue } = input;

    // Get requirement details
    const requirement = await ctx.prisma.requirement.findUnique({
      where: { id: requirementId },
      select: {
        id: true,
        title: true,
        inputType: true,
        operator: true,
        thresholdNumber: true,
        thresholdDate: true,
        thresholdText: true,
        thresholdBool: true,
        checkpointValue: true,
      },
    });

    if (!requirement) {
      throw new Error('Requirement not found');
    }

    const validationResult = {
      isValid: false,
      message: '',
      requirement: {
        id: requirement.id,
        title: requirement.title,
        inputType: requirement.inputType,
        operator: requirement.operator,
      },
    };

    try {
      switch (requirement.inputType) {
        case 'document':
          // For document type, we check if a file URL is provided (S3 URLs or legacy local URLs)
          if (typeof inputValue === 'string') {
            const s3Endpoint = process.env.S3_ENDPOINT || 'https://storage.yandexcloud.net';
            const isS3Url = inputValue.includes(s3Endpoint);
            const isLegacyUrl = inputValue.startsWith('/uploads/');

            if (isS3Url || isLegacyUrl) {
              validationResult.isValid = true;
              validationResult.message = 'Document uploaded successfully';
            } else {
              validationResult.message = 'Valid document upload required';
            }
          } else {
            validationResult.message = 'Valid document upload required';
          }
          break;

        case 'checkpoint':
          // For checkpoint type, check if the value matches the expected checkpoint
          if (typeof inputValue === 'string' && inputValue === requirement.checkpointValue) {
            validationResult.isValid = true;
            validationResult.message = 'Checkpoint value matches requirement';
          } else {
            validationResult.message = `Expected checkpoint value: ${requirement.checkpointValue}`;
          }
          break;

        case 'date':
          if (inputValue instanceof Date || typeof inputValue === 'string') {
            const dateValue = new Date(inputValue);
            const thresholdDate = requirement.thresholdDate;

            if (!thresholdDate) {
              validationResult.message = 'Requirement threshold date not configured';
              break;
            }

            let isValid = false;
            let message = '';

            switch (requirement.operator) {
              case 'eq':
                isValid = dateValue.getTime() === thresholdDate.getTime();
                message = isValid
                  ? 'Date matches requirement'
                  : `Date must be ${thresholdDate.toDateString()}`;
                break;
              case 'neq':
                isValid = dateValue.getTime() !== thresholdDate.getTime();
                message = isValid
                  ? 'Date is acceptable'
                  : `Date must not be ${thresholdDate.toDateString()}`;
                break;
              case 'lt':
                isValid = dateValue.getTime() < thresholdDate.getTime();
                message = isValid
                  ? 'Date is before threshold'
                  : `Date must be before ${thresholdDate.toDateString()}`;
                break;
              case 'lte':
                isValid = dateValue.getTime() <= thresholdDate.getTime();
                message = isValid
                  ? 'Date is on or before threshold'
                  : `Date must be on or before ${thresholdDate.toDateString()}`;
                break;
              case 'gt':
                isValid = dateValue.getTime() > thresholdDate.getTime();
                message = isValid
                  ? 'Date is after threshold'
                  : `Date must be after ${thresholdDate.toDateString()}`;
                break;
              case 'gte':
                isValid = dateValue.getTime() >= thresholdDate.getTime();
                message = isValid
                  ? 'Date is on or after threshold'
                  : `Date must be on or after ${thresholdDate.toDateString()}`;
                break;
              default:
                message = 'Invalid operator for date comparison';
            }

            validationResult.isValid = isValid;
            validationResult.message = message;
          } else {
            validationResult.message = 'Valid date required';
          }
          break;

        case 'text':
          if (typeof inputValue === 'string') {
            const textValue = inputValue.trim();
            const thresholdText = requirement.thresholdText;

            if (!thresholdText) {
              validationResult.message = 'Requirement threshold text not configured';
              break;
            }

            let isValid = false;
            let message = '';

            switch (requirement.operator) {
              case 'eq':
                isValid = textValue === thresholdText;
                message = isValid
                  ? 'Text matches requirement'
                  : `Text must be exactly: ${thresholdText}`;
                break;
              case 'neq':
                isValid = textValue !== thresholdText;
                message = isValid ? 'Text is acceptable' : `Text must not be: ${thresholdText}`;
                break;
              case 'contains':
                isValid = textValue.toLowerCase().includes(thresholdText.toLowerCase());
                message = isValid
                  ? 'Text contains required content'
                  : `Text must contain: ${thresholdText}`;
                break;
              case 'lt':
                isValid = textValue.length < thresholdText.length;
                message = isValid
                  ? 'Text length is acceptable'
                  : `Text must be shorter than ${thresholdText.length} characters`;
                break;
              case 'lte':
                isValid = textValue.length <= thresholdText.length;
                message = isValid
                  ? 'Text length is acceptable'
                  : `Text must be ${thresholdText.length} characters or shorter`;
                break;
              case 'gt':
                isValid = textValue.length > thresholdText.length;
                message = isValid
                  ? 'Text length is acceptable'
                  : `Text must be longer than ${thresholdText.length} characters`;
                break;
              case 'gte':
                isValid = textValue.length >= thresholdText.length;
                message = isValid
                  ? 'Text length is acceptable'
                  : `Text must be ${thresholdText.length} characters or longer`;
                break;
              default:
                message = 'Invalid operator for text comparison';
            }

            validationResult.isValid = isValid;
            validationResult.message = message;
          } else {
            validationResult.message = 'Valid text required';
          }
          break;

        case 'boolean':
          if (typeof inputValue === 'boolean') {
            const thresholdBool = requirement.thresholdBool;

            if (thresholdBool === null || thresholdBool === undefined) {
              validationResult.message = 'Requirement threshold boolean not configured';
              break;
            }

            let isValid = false;
            let message = '';

            switch (requirement.operator) {
              case 'eq':
                isValid = inputValue === thresholdBool;
                message = isValid
                  ? 'Boolean value matches requirement'
                  : `Boolean must be ${thresholdBool}`;
                break;
              case 'neq':
                isValid = inputValue !== thresholdBool;
                message = isValid
                  ? 'Boolean value is acceptable'
                  : `Boolean must not be ${thresholdBool}`;
                break;
              default:
                // For boolean without operator, just check if it matches threshold
                isValid = inputValue === thresholdBool;
                message = isValid
                  ? 'Boolean value matches requirement'
                  : `Boolean must be ${thresholdBool}`;
            }

            validationResult.isValid = isValid;
            validationResult.message = message;
          } else {
            validationResult.message = 'Valid boolean value required';
          }
          break;

        default:
          validationResult.message = 'Unknown requirement input type';
      }
    } catch (error) {
      validationResult.message = `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    return validationResult;
  });

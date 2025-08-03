/**
 * ESLint rule to prevent empty string values in Radix UI Select items
 * This catches the common runtime error: "A <Select.Item /> must have a value prop that is not an empty string"
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent empty string values in Radix UI Select items',
      category: 'Possible Errors',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      emptyValue:
        'SelectItem cannot have an empty string value. Use a non-empty string or render a different element for loading/error states.',
      literalEmptyValue:
        'SelectItem has a literal empty string value. This will cause a runtime error.',
    },
  },

  create(context) {
    function checkSelectItemValue(node) {
      // Check if this is a SelectItem JSX element
      const isSelectItem =
        node.name?.name === 'SelectItem' ||
        (node.name?.type === 'JSXMemberExpression' &&
          node.name.property?.name === 'Item' &&
          (node.name.object?.name === 'Select' || node.name.object?.name === 'SelectContent'));

      if (!isSelectItem) return;

      // Find the value prop
      const valueProp = node.attributes?.find(
        attr => attr.type === 'JSXAttribute' && attr.name?.name === 'value'
      );

      if (!valueProp) return;

      // Check for literal empty string
      if (valueProp.value?.type === 'Literal' && valueProp.value.value === '') {
        context.report({
          node: valueProp,
          messageId: 'literalEmptyValue',
        });
        return;
      }

      // Check for JSX expression that might be empty
      if (valueProp.value?.type === 'JSXExpressionContainer') {
        const expression = valueProp.value.expression;

        // Check for literal empty string in expression
        if (expression.type === 'Literal' && expression.value === '') {
          context.report({
            node: valueProp,
            messageId: 'literalEmptyValue',
          });
          return;
        }

        // Check for common patterns that might result in empty strings
        if (expression.type === 'ConditionalExpression') {
          // Check ternary operator branches
          const { consequent, alternate } = expression;

          if (
            (consequent.type === 'Literal' && consequent.value === '') ||
            (alternate.type === 'Literal' && alternate.value === '')
          ) {
            context.report({
              node: valueProp,
              messageId: 'emptyValue',
            });
          }
        }

        // Check for logical AND/OR expressions that might result in empty strings
        if (expression.type === 'LogicalExpression') {
          const { left, right } = expression;

          if (
            (left.type === 'Literal' && left.value === '') ||
            (right.type === 'Literal' && right.value === '')
          ) {
            context.report({
              node: valueProp,
              messageId: 'emptyValue',
            });
          }
        }
      }
    }

    return {
      JSXElement(node) {
        checkSelectItemValue(node.openingElement);
      },
      JSXFragment(node) {
        // Check self-closing elements in fragments
        node.children?.forEach(child => {
          if (child.type === 'JSXElement') {
            checkSelectItemValue(child.openingElement);
          }
        });
      },
    };
  },
};

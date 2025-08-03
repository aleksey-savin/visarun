import noEmptySelectItemValue from './no-empty-select-item-value.js';

export default {
  rules: {
    'no-empty-select-item-value': noEmptySelectItemValue,
  },
  configs: {
    recommended: {
      plugins: ['custom'],
      rules: {
        'custom/no-empty-select-item-value': 'error',
      },
    },
  },
};

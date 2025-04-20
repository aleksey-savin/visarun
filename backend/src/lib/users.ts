import _ from 'lodash';

export const users = _.times(30, i => ({
  id: i,
  name: `John Doe ${i}`,
  email: `john.doe.${i}@example.com`,
}));

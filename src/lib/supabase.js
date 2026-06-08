import mongoClient from './mongodb';

const mongoUri = import.meta.env.VITE_MONGODB_URI;

console.log('🍃 [JOBOOK] Using MongoDB Atlas Backend');

function runQuery(query) {
  if (query && typeof query.then === 'function') {
    return new Promise((resolve, reject) => query.then(resolve, reject));
  }
  if (query && typeof query.execute === 'function') {
    return query.execute();
  }
  return query;
}

function wrapQuery(queryState) {
  const call = (method, ...args) => wrapQuery(
    queryState.then(({ query }) => ({ query: query[method](...args) }))
  );

  return {
    select: (...args) => call('select', ...args),
    eq: (...args) => call('eq', ...args),
    in: (...args) => call('in', ...args),
    order: (...args) => call('order', ...args),
    limit: (...args) => call('limit', ...args),
    single: () => queryState.then(({ query }) => query.single()),
    then: (resolve, reject) => queryState
      .then(({ query }) => runQuery(query))
      .then(resolve, reject),
    catch: (reject) => queryState
      .then(({ query }) => runQuery(query))
      .catch(reject),
    finally: (callback) => queryState
      .then(({ query }) => runQuery(query))
      .finally(callback),
  };
}

function wrapTable(tableState) {
  const call = (method, ...args) => wrapQuery(
    tableState.then(({ table }) => ({ query: table[method](...args) }))
  );

  return {
    select: (...args) => call('select', ...args),
    insert: (...args) => call('insert', ...args),
    update: (...args) => call('update', ...args),
    delete: (...args) => call('delete', ...args),
  };
}

// MongoDB is the primary database, exposed through a mongoClient-compatible facade.
const mongoClient = {
  ...mongoClient,
  from: (collectionName) => wrapTable(
    Promise.resolve(mongoClient.from(collectionName)).then((table) => ({ table }))
  ),
};

// Validation
if (!mongoUri) {
  console.error('⚠️  VITE_MONGODB_URI not configured in .env');
}

export { mongoClient };

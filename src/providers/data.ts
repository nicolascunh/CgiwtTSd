import simpleRestDataProvider from "@refinedev/simple-rest";
import type { DataProvider } from "@refinedev/core";

export const createDataProvider = (apiUrl: string): DataProvider => {
  const dataProvider = simpleRestDataProvider(apiUrl);

  const customDataProvider: DataProvider = {
    ...dataProvider,
    getList: async (params) => {
      const storedCredentials = localStorage.getItem("auth-credentials");
      const headers = storedCredentials ? {
        "Authorization": `Basic ${storedCredentials}`
      } : {};

      // Mapear recursos para endpoints da API Trackmax
      let endpoint = params.resource;
      if (params.resource === 'devices') {
        endpoint = 'devices';
      } else if (params.resource === 'positions') {
        endpoint = 'positions';
      } else if (params.resource === 'users') {
        endpoint = 'users';
      } else if (params.resource === 'groups') {
        endpoint = 'groups';
      } else if (params.resource === 'notifications') {
        endpoint = 'notifications';
      } else if (params.resource === 'route-reports') {
        endpoint = 'reports/route';
      }

      return dataProvider.getList({
        ...params,
        resource: endpoint,
        meta: {
          ...params.meta,
          headers,
        },
      });
    },
    getOne: async (params) => {
      const storedCredentials = localStorage.getItem("auth-credentials");
      const headers = storedCredentials ? {
        "Authorization": `Basic ${storedCredentials}`
      } : {};

      // Mapear recursos para endpoints da API Trackmax
      let endpoint = params.resource;
      if (params.resource === 'devices') {
        endpoint = 'devices';
      } else if (params.resource === 'positions') {
        endpoint = 'positions';
      } else if (params.resource === 'users') {
        endpoint = 'users';
      } else if (params.resource === 'groups') {
        endpoint = 'groups';
      } else if (params.resource === 'notifications') {
        endpoint = 'notifications';
      }

      return dataProvider.getOne({
        ...params,
        resource: endpoint,
        meta: {
          ...params.meta,
          headers,
        },
      });
    },
    create: async (params) => {
      const storedCredentials = localStorage.getItem("auth-credentials");
      const headers = storedCredentials ? {
        "Authorization": `Basic ${storedCredentials}`
      } : {};

      // Mapear recursos para endpoints da API Trackmax
      let endpoint = params.resource;
      if (params.resource === 'devices') {
        endpoint = 'devices';
      } else if (params.resource === 'users') {
        endpoint = 'users';
      } else if (params.resource === 'groups') {
        endpoint = 'groups';
      } else if (params.resource === 'notifications') {
        endpoint = 'notifications';
      }

      return dataProvider.create({
        ...params,
        resource: endpoint,
        meta: {
          ...params.meta,
          headers,
        },
      });
    },
    update: async (params) => {
      const storedCredentials = localStorage.getItem("auth-credentials");
      const headers = storedCredentials ? {
        "Authorization": `Basic ${storedCredentials}`
      } : {};

      // Mapear recursos para endpoints da API Trackmax
      let endpoint = params.resource;
      if (params.resource === 'devices') {
        endpoint = 'devices';
      } else if (params.resource === 'users') {
        endpoint = 'users';
      } else if (params.resource === 'groups') {
        endpoint = 'groups';
      } else if (params.resource === 'notifications') {
        endpoint = 'notifications';
      }

      return dataProvider.update({
        ...params,
        resource: endpoint,
        meta: {
          ...params.meta,
          headers,
        },
      });
    },
    deleteOne: async (params) => {
      const storedCredentials = localStorage.getItem("auth-credentials");
      const headers = storedCredentials ? {
        "Authorization": `Basic ${storedCredentials}`
      } : {};

      // Mapear recursos para endpoints da API Trackmax
      let endpoint = params.resource;
      if (params.resource === 'devices') {
        endpoint = 'devices';
      } else if (params.resource === 'users') {
        endpoint = 'users';
      } else if (params.resource === 'groups') {
        endpoint = 'groups';
      } else if (params.resource === 'notifications') {
        endpoint = 'notifications';
      }

      return dataProvider.deleteOne({
        ...params,
        resource: endpoint,
        meta: {
          ...params.meta,
          headers,
        },
      });
    },
    custom: async (params) => {
      const storedCredentials = localStorage.getItem("auth-credentials");
      const headers = storedCredentials ? {
        "Authorization": `Basic ${storedCredentials}`,
        ...params.headers
      } : params.headers;

      return dataProvider.custom({
        ...params,
        headers,
      });
    },
  };

  return customDataProvider;
};

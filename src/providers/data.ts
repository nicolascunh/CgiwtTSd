import axios from "axios";
import simpleRestDataProvider from "@refinedev/simple-rest";
import type { DataProvider } from "@refinedev/core";
import { getApiUrlSync } from "../config/api";

const mapResource = (resource: string) => {
  switch (resource) {
    case "devices":
      return "devices";
    case "positions":
      return "positions";
    case "users":
      return "users";
    case "groups":
      return "groups";
    case "notifications":
      return "notifications";
    case "route-reports":
      return "reports/route";
    default:
      return resource;
  }
};

export const createDataProvider = (): DataProvider => {
  const baseUrl = getApiUrlSync();

  const axiosInstance = axios.create({
    baseURL: baseUrl,
    withCredentials: true,
  });

  axiosInstance.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
      const basic = localStorage.getItem("auth-basic");
      if (basic) {
        config.headers = config.headers ?? {};
        config.headers["Authorization"] = `Basic ${basic}`;
      } else if (config.headers) {
        delete config.headers["Authorization"];
      }
    }
    return config;
  });

  const dataProvider = simpleRestDataProvider(baseUrl, axiosInstance);

  return {
    ...dataProvider,
    getList: (params) =>
      dataProvider.getList({
        ...params,
        resource: mapResource(params.resource),
      }),
    getOne: (params) =>
      dataProvider.getOne({
        ...params,
        resource: mapResource(params.resource),
      }),
    create: (params) =>
      dataProvider.create({
        ...params,
        resource: mapResource(params.resource),
      }),
    update: (params) =>
      dataProvider.update({
        ...params,
        resource: mapResource(params.resource),
      }),
    deleteOne: (params) =>
      dataProvider.deleteOne({
        ...params,
        resource: mapResource(params.resource),
      }),
    custom: (params) => dataProvider.custom(params),
  };
};

import { Show, TextField, TagField } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";
import type { Device } from "../../types";

const { Title } = Typography;

export const DeviceShow = () => {
  const { queryResult } = useShow<Device>();
  const { data, isLoading } = queryResult;
  const record = data?.data;

  return (
    <Show isLoading={isLoading}>
      <Title level={5}>Name</Title>
      <TextField value={record?.name} />

      <Title level={5}>Unique ID</Title>
      <TextField value={record?.uniqueId} />

      <Title level={5}>Status</Title>
      <TagField value={record?.status} />

      <Title level={5}>Model</Title>
      <TextField value={record?.model || "-"} />

      <Title level={5}>Phone</Title>
      <TextField value={record?.phone || "-"} />

      <Title level={5}>Contact</Title>
      <TextField value={record?.contact || "-"} />

      <Title level={5}>Category</Title>
      <TextField value={record?.category || "-"} />

      <Title level={5}>Last Update</Title>
      <TextField value={record?.lastUpdate || "-"} />

      <Title level={5}>Disabled</Title>
      <TagField value={record?.disabled ? "Yes" : "No"} />
    </Show>
  );
};

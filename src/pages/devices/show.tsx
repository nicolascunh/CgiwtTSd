import { Show, TextField, TagField } from "@refinedev/antd";
import { Typography } from "antd";

const { Title } = Typography;

export const DeviceShow = () => {
  return (
    <Show>
      <Title level={5}>Device Details</Title>
      <p>Device information will be displayed here.</p>
    </Show>
  );
};

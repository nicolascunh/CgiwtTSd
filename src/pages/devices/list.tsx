import { List, useTable, EditButton, ShowButton } from "@refinedev/antd";
import { Table, Space, Tag } from "antd";
import type { Device } from "../../types";

const getStatusTag = (status: string) => {
  const colorMap = {
    online: "success",
    offline: "error",
    unknown: "default",
  };

  return <Tag color={colorMap[status as keyof typeof colorMap]}>{status}</Tag>;
};

export const DeviceList: React.FC = () => {
  const { tableProps } = useTable<Device>({
    syncWithLocation: true,
  });

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" />
        <Table.Column dataIndex="name" title="Name" />
        <Table.Column dataIndex="uniqueId" title="Unique ID" />
        <Table.Column dataIndex="status" title="Status" render={(value: string) => getStatusTag(value)} />
        <Table.Column
          dataIndex="disabled"
          title="Disabled"
          render={(value: boolean) => <Tag color={value ? "error" : "success"}>{value ? "Yes" : "No"}</Tag>}
        />
        <Table.Column dataIndex="groupId" title="Group ID" />
        <Table.Column dataIndex="phone" title="Phone" />
        <Table.Column dataIndex="model" title="Model" />
        <Table.Column
          title="Actions"
          dataIndex="actions"
          fixed="right"
          render={(_, record: Device) => (
            <Space>
              <ShowButton hideText size="small" recordItemId={record.id} />
              <EditButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};

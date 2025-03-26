import { List, Datagrid, TextField, DateField, DeleteButton } from 'react-admin';

export const PostList = () => (
  <List>
    <Datagrid>
      <TextField source="id" />
      <TextField source="title" />
      <TextField source="type" />
      <DateField source="createdAt" />
      <DeleteButton />
    </Datagrid>
  </List>
);


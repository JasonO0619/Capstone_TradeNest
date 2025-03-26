import { List, Datagrid, TextField, EmailField, DeleteButton } from 'react-admin';

export const UserList = () => (
  <List>
    <Datagrid>
      <TextField source="id" />
      <TextField source="name" />
      <EmailField source="email" />
      <DeleteButton />
    </Datagrid>
  </List>
);

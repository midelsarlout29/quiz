import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  useEffect(() => { api.get('/users').then((res) => setUsers(res.data)); }, []);
  return (
    <section>
      <div className="page-title"><h1>Kelola Pengguna</h1><p>Admin dapat memantau role dan data akun.</p></div>
      <div className="panel table">
        {users.map((user) => (
          <div className="tr" key={user.id}>
            <span>{user.name}</span><span>{user.email}</span><strong>{user.role.label}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

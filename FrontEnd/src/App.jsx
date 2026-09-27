import { useEffect, useState } from 'react'
import Login from './Login'
import { DataTable } from 'primereact/datatable'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import useDebounce from './hooks/useDebounce'
import { useAuth } from './context/AuthContext'

function App() {
  const { loggedIn, userRole, handleLogin, handleLogout } = useAuth()

  const [employees, setEmployees] = useState([])
  const [totalEmployees, setTotalEmployees] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const pageSize = 5

  const [showForm, setShowForm] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [editingEmployee, setEditingEmployee] = useState(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('')

  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 400)

  // -------------------------
  // LOGOUT (auth state + cookie clearing now lives in AuthContext;
  // this just resets this page's local UI state)
  // -------------------------

  const onLogoutClick = () => {
    handleLogout()

    setEmployees([])
    setSelectedEmployee(null)
    setEditingEmployee(null)

    setShowDetails(false)
    setShowForm(false)

    setSearchTerm('')
    setError('')
  }

  // -------------------------
  // GET EMPLOYEES
  // -------------------------

  const getEmployees = (searchValue = '', pageValue = 1) => {
    const params = new URLSearchParams()

    if (searchValue) {
      params.set('search', searchValue)
    }

    params.set('page', pageValue)
    params.set('limit', pageSize)

    fetch(`http://localhost:8000/employees?${params.toString()}`, {
      credentials: 'include'
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch employees')
        }

        return response.json()
      })
      .then((data) => {
        setEmployees(Array.isArray(data.employees) ? data.employees : [])
        setTotalEmployees(data.total ?? 0)
        setTotalPages(data.total_pages ?? 1)
      })
      .catch((error) => {
        console.error('Error fetching employees:', error)
        setError('Unable to load employees.')
      })
  }

  // -------------------------
  // LOAD EMPLOYEES AFTER LOGIN
  // -------------------------

  useEffect(() => {
    if (loggedIn) {
      getEmployees(debouncedSearch, page)
    }
  }, [loggedIn, debouncedSearch, page])

  // reset back to page 1 whenever the search term changes
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  // -------------------------
  // RESET FORM
  // -------------------------

  const resetForm = () => {
    setName('')
    setEmail('')
    setDepartment('')
    setEditingEmployee(null)
    setError('')
  }

  // -------------------------
  // OPEN ADD FORM
  // -------------------------

  const openAddForm = () => {
    resetForm()
    setShowForm(true)
    setShowDetails(false)
  }

  // -------------------------
  // ADD EMPLOYEE
  // -------------------------

  const addEmployee = () => {
    if (!name.trim() || !email.trim() || !department.trim()) {
      setError('Please fill in all fields.')
      return
    }

    const newEmployee = {
      name: name.trim(),
      email: email.trim(),
      department: department.trim()
    }

    fetch('http://localhost:8000/employees', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(newEmployee)
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to add employee')
        }

        return response.json()
      })
      .then(() => {
        resetForm()
        setShowForm(false)
        getEmployees()
      })
      .catch((error) => {
        console.error('Error adding employee:', error)
        setError('Unable to add employee.')
      })
  }

  // -------------------------
  // VIEW EMPLOYEE
  // -------------------------

  const viewEmployee = (employee) => {
    setSelectedEmployee(employee)
    setShowDetails(true)
    setShowForm(false)
  }

  // -------------------------
  // START EDIT
  // -------------------------

  const startEdit = (employee) => {
    setEditingEmployee(employee)

    setName(employee.name)
    setEmail(employee.email)
    setDepartment(employee.department)

    setError('')
    setShowDetails(false)
    setShowForm(true)
  }

  // -------------------------
  // UPDATE EMPLOYEE
  // -------------------------

  const updateEmployee = () => {
    if (!name.trim() || !email.trim() || !department.trim()) {
      setError('Please fill in all fields.')
      return
    }

    const updatedEmployee = {
      name: name.trim(),
      email: email.trim(),
      department: department.trim()
    }

    fetch(
      `http://localhost:8000/employees/${editingEmployee.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(updatedEmployee)
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to update employee')
        }

        return response.json()
      })
      .then(() => {
        resetForm()
        setShowForm(false)
        getEmployees()
      })
      .catch((error) => {
        console.error('Error updating employee:', error)
        setError('Unable to update employee.')
      })
  }

  // -------------------------
  // DELETE EMPLOYEE
  // -------------------------

  const deleteEmployee = (employeeId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this employee?'
    )

    if (!confirmed) {
      return
    }

    fetch(
      `http://localhost:8000/employees/${employeeId}`,
      {
        method: 'DELETE',
        credentials: 'include'
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to delete employee')
        }

        return response.json()
      })
      .then(() => {
        if (
          selectedEmployee &&
          selectedEmployee.id === employeeId
        ) {
          setSelectedEmployee(null)
          setShowDetails(false)
        }

        getEmployees()
      })
      .catch((error) => {
        console.error('Error deleting employee:', error)
        setError('Unable to delete employee.')
      })
  }

  // -------------------------
  // CANCEL FORM
  // -------------------------

  const cancelForm = () => {
    resetForm()
    setShowForm(false)
  }

  // -------------------------
  // LOGIN PAGE
  // -------------------------

  if (!loggedIn) {
    return <Login onLogin={handleLogin} />
  }

  // Search and pagination now happen server-side (see getEmployees) —
  // `employees` already holds exactly the rows for the current
  // page/search, so it's used directly below.

  // -------------------------
  // MAIN PAGE
  // -------------------------

  return (
    <div className="app-container">

      {/* HEADER */}

      <div className="page-header">

        <div>
          <h1>Employee Directory</h1>

          <p className="page-subtitle">
            {userRole === 'admin'
              ? 'Admin Dashboard'
              : 'My Employee Profile'}
          </p>
        </div>

        <div className="header-actions">

          {/* ADD EMPLOYEE - ADMIN ONLY */}

          {userRole === 'admin' && (
            <Button
              className="add-button"
              onClick={openAddForm}
            >
              + Add Employee
            </Button>
          )}

          {/* LOGOUT */}

          <Button
            className="logout-button"
            onClick={onLogoutClick}
          >
            Logout
          </Button>

        </div>

      </div>

      {/* ERROR */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* ADD / EDIT FORM */}

      {showForm && (
        <div className="employee-form">

          <div className="form-header">

            <div>

              <h2>
                {editingEmployee
                  ? 'Edit Employee'
                  : 'Add Employee'}
              </h2>

              <p>
                {editingEmployee
                  ? 'Update employee information'
                  : 'Enter employee information below'}
              </p>

            </div>

          </div>

          <div className="form-grid">

            {/* NAME */}

            <div className="form-field">

              <label htmlFor="name">
                Name
              </label>

              <InputText
                id="name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Enter employee name"
              />

            </div>

            {/* EMAIL */}

            <div className="form-field">

              <label htmlFor="email">
                Email
              </label>

              <InputText
                id="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="Enter email address"
              />

            </div>

            {/* DEPARTMENT */}

            <div className="form-field">

              <label htmlFor="department">
                Department
              </label>

              <InputText
                id="department"
                value={department}
                onChange={(e) =>
                  setDepartment(e.target.value)
                }
                placeholder="Enter department"
              />

            </div>

          </div>

          <div className="form-actions">

            <Button
              className="save-button"
              onClick={
                editingEmployee
                  ? updateEmployee
                  : addEmployee
              }
            >
              {editingEmployee
                ? 'Update Employee'
                : 'Save Employee'}
            </Button>

            <Button
              className="cancel-button"
              onClick={cancelForm}
            >
              Cancel
            </Button>

          </div>

        </div>
      )}

      {/* EMPLOYEE DETAILS */}

      {showDetails && selectedEmployee && (
        <div className="employee-details">

          <div className="details-header">

            <div>

              <h2>Employee Details</h2>

              <p>
                Employee ID: #{selectedEmployee.id}
              </p>

            </div>

            <Button
              className="close-button"
              onClick={() =>
                setShowDetails(false)
              }
            >
              ×
            </Button>

          </div>

          <div className="details-grid">

            <div className="detail-item">

              <span>Name</span>

              <strong>
                {selectedEmployee.name}
              </strong>

            </div>

            <div className="detail-item">

              <span>Email</span>

              <strong>
                {selectedEmployee.email}
              </strong>

            </div>

            <div className="detail-item">

              <span>Department</span>

              <strong>
                {selectedEmployee.department}
              </strong>

            </div>

          </div>

          <div className="details-actions">

            <Button
              className="edit-button"
              onClick={() =>
                startEdit(selectedEmployee)
              }
            >
              Edit Employee
            </Button>

            <Button
              className="cancel-button"
              onClick={() =>
                setShowDetails(false)
              }
            >
              Close
            </Button>

          </div>

        </div>
      )}

      {/* EMPLOYEE TABLE */}

      <div className="table-card">

        {/* TABLE HEADER */}

        <div className="table-header">

          <div>

            <h2>
              {userRole === 'admin'
                ? 'Employees'
                : 'My Details'}
            </h2>

            <p>
              {totalEmployees} employee
              {totalEmployees !== 1
                ? 's'
                : ''}{' '}
              found
            </p>

          </div>

          {/* SEARCH - ADMIN ONLY */}

          {userRole === 'admin' && (
            <InputText
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
              placeholder="Search by name, email, department or ID..."
              className="employee-search"
            />
          )}

        </div>

        {/* DATA TABLE */}

        <DataTable.Root
          data={employees}
          dataKey="id"
        >

          <DataTable.TableContainer>

            <DataTable.Table>

              <DataTable.THead>

                <DataTable.THeadRow>

                  {/* SERIAL NUMBER */}

                  <DataTable.THeadCell>
                    S.No.
                  </DataTable.THeadCell>

                  {/* DATABASE ID */}

                  <DataTable.THeadCell>
                    Employee ID
                  </DataTable.THeadCell>

                  {/* NAME */}

                  <DataTable.THeadCell>
                    Name
                  </DataTable.THeadCell>

                  {/* EMAIL */}

                  <DataTable.THeadCell>
                    Email
                  </DataTable.THeadCell>

                  {/* DEPARTMENT */}

                  <DataTable.THeadCell>
                    Department
                  </DataTable.THeadCell>

                  {/* ACTIONS */}

                  <DataTable.THeadCell>
                    Actions
                  </DataTable.THeadCell>

                </DataTable.THeadRow>

              </DataTable.THead>

              <DataTable.TBody>

                {({ item }) => {

                  const serialNumber =
                    employees.findIndex(
                      (employee) =>
                        employee.id === item.id
                    ) + 1 + (page - 1) * pageSize

                  return (
                    <DataTable.Row>

                      {/* S.NO. */}

                      <DataTable.Cell>

                        <span className="serial-number">
                          {serialNumber}
                        </span>

                      </DataTable.Cell>

                      {/* DATABASE ID */}

                      <DataTable.Cell>

                        <span className="employee-id">
                          #{item.id}
                        </span>

                      </DataTable.Cell>

                      {/* NAME */}

                      <DataTable.Cell>

                        <strong>
                          {item.name}
                        </strong>

                      </DataTable.Cell>

                      {/* EMAIL */}

                      <DataTable.Cell>
                        {item.email}
                      </DataTable.Cell>

                      {/* DEPARTMENT */}

                      <DataTable.Cell>

                        <span className="department-badge">
                          {item.department}
                        </span>

                      </DataTable.Cell>

                      {/* ACTIONS */}

                      <DataTable.Cell>

                        <div className="action-buttons">

                          {/* VIEW */}

                          <Button
                            className="view-button"
                            onClick={() =>
                              viewEmployee(item)
                            }
                          >
                            View
                          </Button>

                          {/* EDIT */}

                          <Button
                            className="edit-button"
                            onClick={() =>
                              startEdit(item)
                            }
                          >
                            Edit
                          </Button>

                          {/* DELETE - ADMIN ONLY */}

                          {userRole === 'admin' && (
                            <Button
                              className="delete-button"
                              onClick={() =>
                                deleteEmployee(item.id)
                              }
                            >
                              Delete
                            </Button>
                          )}

                        </div>

                      </DataTable.Cell>

                    </DataTable.Row>
                  )
                }}

              </DataTable.TBody>

            </DataTable.Table>

          </DataTable.TableContainer>

        </DataTable.Root>

        {/* PAGINATION */}

        {totalPages > 1 && (
          <div className="pagination-controls">
            <Button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>

            <span>
              Page {page} of {totalPages}
            </span>

            <Button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        )}

      </div>

    </div>
  )
}

export default App


/// from here old




// import { useEffect, useState } from 'react'
// import Login from './Login'
// import { DataTable } from 'primereact/datatable'
// import { Button } from 'primereact/button'
// import { InputText } from 'primereact/inputtext'

// function App() {

//   const [loggedIn, setLoggedIn] = useState(false)
//   const [userRole, setUserRole] = useState(null)

//   const [employees, setEmployees] = useState([])

//   const [showForm, setShowForm] = useState(false)
//   const [showDetails, setShowDetails] = useState(false)

//   const [selectedEmployee, setSelectedEmployee] = useState(null)
//   const [editingEmployee, setEditingEmployee] = useState(null)

//   const [name, setName] = useState('')
//   const [email, setEmail] = useState('')
//   const [department, setDepartment] = useState('')

//   const [error, setError] = useState('')
//   const [searchTerm, setSearchTerm] = useState('')


//   // -------------------------
//   // LOGIN
//   // -------------------------

//   const handleLogin = (data) => {

//     setUserRole(data.role)

//     setLoggedIn(true)

//     setError('')
//   }


//   // -------------------------
//   // LOGOUT
//   // -------------------------

//   const handleLogout = async () => {

//     try {

//       await fetch(
//         'http://127.0.0.1:8000/logout',
//         {
//           method: 'POST',
//           credentials: 'include'
//         }
//       )

//     } catch (error) {

//       console.error(
//         'Logout error:',
//         error
//       )

//     }

//     setLoggedIn(false)
//     setUserRole(null)

//     setEmployees([])

//     setSelectedEmployee(null)
//     setEditingEmployee(null)

//     setShowDetails(false)
//     setShowForm(false)

//     setSearchTerm('')
//     setError('')
//   }


//   // -------------------------
//   // GET EMPLOYEES
//   // -------------------------

// const getEmployees = () => {

//   fetch(
//     'http://localhost:8000/employees',
//     {
//       method: 'GET',
//       credentials: 'include'
//     }
//   )
//     .then(async (response) => {

//       console.log('EMPLOYEE RESPONSE:', response)

//       const data = await response.json()

//       console.log('EMPLOYEE DATA:', data)

//       if (!response.ok) {
//         throw new Error(
//           data.detail || 'Failed to fetch employees'
//         )
//       }

//       return data
//     })

//     .then((data) => {

//       console.log('SETTING EMPLOYEES:', data)

//       setEmployees(
//         Array.isArray(data)
//           ? data
//           : []
//       )

//     })

//     .catch((error) => {

//       console.error(
//         'Error fetching employees:',
//         error
//       )

//       setError(
//         'Unable to load employees.'
//       )

//     })
// }


//   // -------------------------
//   // LOAD EMPLOYEES
//   // -------------------------

//   useEffect(() => {

//     if (loggedIn) {
//       getEmployees()
//     }

//   }, [loggedIn])


//   // -------------------------
//   // RESET FORM
//   // -------------------------

//   const resetForm = () => {

//     setName('')
//     setEmail('')
//     setDepartment('')

//     setEditingEmployee(null)

//     setError('')
//   }


//   // -------------------------
//   // OPEN ADD FORM
//   // -------------------------

//   const openAddForm = () => {

//     resetForm()

//     setShowForm(true)
//     setShowDetails(false)
//   }


//   // -------------------------
//   // ADD EMPLOYEE
//   // -------------------------

//   const addEmployee = () => {

//     if (
//       !name.trim() ||
//       !email.trim() ||
//       !department.trim()
//     ) {

//       setError(
//         'Please fill in all fields.'
//       )

//       return
//     }

//     const newEmployee = {

//       name: name.trim(),

//       email: email.trim(),

//       department:
//         department.trim()
//     }

//     fetch(
//       'http://localhost:8000/employees',
//       {
//         method: 'POST',

//         headers: {
//           'Content-Type':
//             'application/json'
//         },

//         credentials: 'include',

//         body:
//           JSON.stringify(newEmployee)
//       }
//     )
//       .then((response) => {

//         if (!response.ok) {

//           throw new Error(
//             'Failed to add employee'
//           )

//         }

//         return response.json()
//       })

//       .then(() => {

//         resetForm()

//         setShowForm(false)

//         getEmployees()

//       })

//       .catch((error) => {

//         console.error(
//           'Error adding employee:',
//           error
//         )

//         setError(
//           'Unable to add employee.'
//         )

//       })
//   }


//   // -------------------------
//   // VIEW EMPLOYEE
//   // -------------------------

//   const viewEmployee = (employee) => {

//     setSelectedEmployee(employee)

//     setShowDetails(true)

//     setShowForm(false)
//   }


//   // -------------------------
//   // START EDIT
//   // -------------------------

//   const startEdit = (employee) => {

//     setEditingEmployee(employee)

//     setName(employee.name)
//     setEmail(employee.email)
//     setDepartment(employee.department)

//     setError('')

//     setShowDetails(false)
//     setShowForm(true)
//   }


//   // -------------------------
//   // UPDATE EMPLOYEE
//   // -------------------------

//   const updateEmployee = () => {

//     if (
//       !name.trim() ||
//       !email.trim() ||
//       !department.trim()
//     ) {

//       setError(
//         'Please fill in all fields.'
//       )

//       return
//     }

//     const updatedEmployee = {

//       name: name.trim(),

//       email: email.trim(),

//       department:
//         department.trim()
//     }

//     fetch(
//       `http://localhost:8000/employees/${editingEmployee.id}`,
//       {
//         method: 'PUT',

//         headers: {
//           'Content-Type':
//             'application/json'
//         },

//         credentials: 'include',

//         body:
//           JSON.stringify(updatedEmployee)
//       }
//     )
//       .then((response) => {

//         if (!response.ok) {

//           throw new Error(
//             'Failed to update employee'
//           )

//         }

//         return response.json()
//       })

//       .then(() => {

//         resetForm()

//         setShowForm(false)

//         getEmployees()

//       })

//       .catch((error) => {

//         console.error(
//           'Error updating employee:',
//           error
//         )

//         setError(
//           'Unable to update employee.'
//         )

//       })
//   }


//   // -------------------------
//   // DELETE EMPLOYEE
//   // -------------------------

//   const deleteEmployee = (employeeId) => {

//     const confirmed =
//       window.confirm(
//         'Are you sure you want to delete this employee?'
//       )

//     if (!confirmed) {
//       return
//     }

//     fetch(
//       `http://127.0.0.1:8000/employees/${employeeId}`,
//       {
//         method: 'DELETE',

//         credentials: 'include'
//       }
//     )
//       .then((response) => {

//         if (!response.ok) {

//           throw new Error(
//             'Failed to delete employee'
//           )

//         }

//         return response.json()
//       })

//       .then(() => {

//         if (
//           selectedEmployee &&
//           selectedEmployee.id === employeeId
//         ) {

//           setSelectedEmployee(null)

//           setShowDetails(false)
//         }

//         getEmployees()

//       })

//       .catch((error) => {

//         console.error(
//           'Error deleting employee:',
//           error
//         )

//         setError(
//           'Unable to delete employee.'
//         )

//       })
//   }


//   // -------------------------
//   // CANCEL FORM
//   // -------------------------

//   const cancelForm = () => {

//     resetForm()

//     setShowForm(false)
//   }


//   // -------------------------
//   // LOGIN PAGE
//   // -------------------------

//   if (!loggedIn) {

//     return (
//       <Login
//         onLogin={handleLogin}
//       />
//     )
//   }


//   // -------------------------
//   // SEARCH / FILTER
//   // -------------------------

//   const filteredEmployees =
//     employees.filter((employee) => {

//       const search =
//         searchTerm
//           .toLowerCase()
//           .trim()

//       if (!search) {
//         return true
//       }

//       return (

//         employee.name
//           ?.toLowerCase()
//           .includes(search)

//         ||

//         employee.email
//           ?.toLowerCase()
//           .includes(search)

//         ||

//         employee.department
//           ?.toLowerCase()
//           .includes(search)

//         ||

//         employee.id
//           ?.toString()
//           .includes(search)
//       )
//     })


//   // -------------------------
//   // MAIN PAGE
//   // -------------------------

//   return (

//     <div className="app-container">

//       {/* HEADER */}

//       <div className="page-header">

//         <div>

//           <h1>
//             Employee Directory
//           </h1>

//           <p className="page-subtitle">

//             {userRole === 'admin'
//               ? 'Admin Dashboard'
//               : 'My Employee Profile'}

//           </p>

//         </div>


//         <div className="header-actions">

//           {/* ADD EMPLOYEE */}

//           {userRole === 'admin' && (

//             <Button
//               className="add-button"
//               onClick={openAddForm}
//             >
//               + Add Employee
//             </Button>

//           )}


//           {/* LOGOUT */}

//           <Button
//             className="logout-button"
//             onClick={handleLogout}
//           >
//             Logout
//           </Button>

//         </div>

//       </div>


//       {/* ERROR */}

//       {error && (

//         <div className="error-message">
//           {error}
//         </div>

//       )}


//       {/* ADD / EDIT FORM */}

//       {showForm && (

//         <div className="employee-form">

//           <div className="form-header">

//             <div>

//               <h2>

//                 {editingEmployee
//                   ? 'Edit Employee'
//                   : 'Add Employee'}

//               </h2>

//               <p>

//                 {editingEmployee
//                   ? 'Update employee information'
//                   : 'Enter employee information below'}

//               </p>

//             </div>

//           </div>


//           <div className="form-grid">

//             <div className="form-field">

//               <label htmlFor="name">
//                 Name
//               </label>

//               <InputText
//                 id="name"
//                 value={name}
//                 onChange={(e) =>
//                   setName(e.target.value)
//                 }
//                 placeholder="Enter employee name"
//               />

//             </div>


//             <div className="form-field">

//               <label htmlFor="email">
//                 Email
//               </label>

//               <InputText
//                 id="email"
//                 value={email}
//                 onChange={(e) =>
//                   setEmail(e.target.value)
//                 }
//                 placeholder="Enter email address"
//               />

//             </div>


//             <div className="form-field">

//               <label htmlFor="department">
//                 Department
//               </label>

//               <InputText
//                 id="department"
//                 value={department}
//                 onChange={(e) =>
//                   setDepartment(e.target.value)
//                 }
//                 placeholder="Enter department"
//               />

//             </div>

//           </div>


//           <div className="form-actions">

//             <Button
//               className="save-button"
//               onClick={
//                 editingEmployee
//                   ? updateEmployee
//                   : addEmployee
//               }
//             >

//               {editingEmployee
//                 ? 'Update Employee'
//                 : 'Save Employee'}

//             </Button>


//             <Button
//               className="cancel-button"
//               onClick={cancelForm}
//             >
//               Cancel
//             </Button>

//           </div>

//         </div>

//       )}


//       {/* EMPLOYEE DETAILS */}

//       {showDetails &&
//         selectedEmployee && (

//           <div className="employee-details">

//             <div className="details-header">

//               <div>

//                 <h2>
//                   Employee Details
//                 </h2>

//                 <p>
//                   Employee ID:
//                   #{selectedEmployee.id}
//                 </p>

//               </div>


//               <Button
//                 className="close-button"
//                 onClick={() =>
//                   setShowDetails(false)
//                 }
//               >
//                 ×
//               </Button>

//             </div>


//             <div className="details-grid">

//               <div className="detail-item">

//                 <span>
//                   Name
//                 </span>

//                 <strong>
//                   {selectedEmployee.name}
//                 </strong>

//               </div>


//               <div className="detail-item">

//                 <span>
//                   Email
//                 </span>

//                 <strong>
//                   {selectedEmployee.email}
//                 </strong>

//               </div>


//               <div className="detail-item">

//                 <span>
//                   Department
//                 </span>

//                 <strong>
//                   {selectedEmployee.department}
//                 </strong>

//               </div>

//             </div>


//             <div className="details-actions">

//               <Button
//                 className="edit-button"
//                 onClick={() =>
//                   startEdit(selectedEmployee)
//                 }
//               >
//                 Edit Employee
//               </Button>


//               <Button
//                 className="cancel-button"
//                 onClick={() =>
//                   setShowDetails(false)
//                 }
//               >
//                 Close
//               </Button>

//             </div>

//           </div>

//         )}


//       {/* EMPLOYEE TABLE */}

//       <div className="table-card">

//         <div className="table-header">

//           <div>

//             <h2>

//               {userRole === 'admin'
//                 ? 'Employees'
//                 : 'My Details'}

//             </h2>

//             <p>

//               {filteredEmployees.length}
//               {' '}
//               employee
//               {filteredEmployees.length !== 1
//                 ? 's'
//                 : ''}
//               {' '}
//               found

//             </p>

//           </div>


//           {/* SEARCH - ADMIN ONLY */}

//           {userRole === 'admin' && (

//             <InputText
//               value={searchTerm}
//               onChange={(e) =>
//                 setSearchTerm(
//                   e.target.value
//                 )
//               }
//               placeholder="Search by name, email, department or ID..."
//               className="employee-search"
//             />

//           )}

//         </div>


//         {/* DATA TABLE */}

//         <DataTable.Root
//           data={filteredEmployees}
//           dataKey="id"
//         >

//           <DataTable.TableContainer>

//             <DataTable.Table>

//               <DataTable.THead>

//                 <DataTable.THeadRow>

//                   <DataTable.THeadCell>
//                     S.No.
//                   </DataTable.THeadCell>

//                   <DataTable.THeadCell>
//                     Employee ID
//                   </DataTable.THeadCell>

//                   <DataTable.THeadCell>
//                     Name
//                   </DataTable.THeadCell>

//                   <DataTable.THeadCell>
//                     Email
//                   </DataTable.THeadCell>

//                   <DataTable.THeadCell>
//                     Department
//                   </DataTable.THeadCell>

//                   <DataTable.THeadCell>
//                     Actions
//                   </DataTable.THeadCell>

//                 </DataTable.THeadRow>

//               </DataTable.THead>


//               <DataTable.TBody>

//                 {({ item }) => {

//                   const serialNumber =
//                     filteredEmployees.findIndex(
//                       (employee) =>
//                         employee.id === item.id
//                     ) + 1

//                   return (

//                     <DataTable.Row>

//                       {/* S.NO. */}

//                       <DataTable.Cell>

//                         <span className="serial-number">
//                           {serialNumber}
//                         </span>

//                       </DataTable.Cell>


//                       {/* DATABASE ID */}

//                       <DataTable.Cell>

//                         <span className="employee-id">
//                           #{item.id}
//                         </span>

//                       </DataTable.Cell>


//                       {/* NAME */}

//                       <DataTable.Cell>

//                         <strong>
//                           {item.name}
//                         </strong>

//                       </DataTable.Cell>


//                       {/* EMAIL */}

//                       <DataTable.Cell>
//                         {item.email}
//                       </DataTable.Cell>


//                       {/* DEPARTMENT */}

//                       <DataTable.Cell>

//                         <span className="department-badge">
//                           {item.department}
//                         </span>

//                       </DataTable.Cell>


//                       {/* ACTIONS */}

//                       <DataTable.Cell>

//                         <div className="action-buttons">

//                           <Button
//                             className="view-button"
//                             onClick={() =>
//                               viewEmployee(item)
//                             }
//                           >
//                             View
//                           </Button>


//                           <Button
//                             className="edit-button"
//                             onClick={() =>
//                               startEdit(item)
//                             }
//                           >
//                             Edit
//                           </Button>


//                           {/* DELETE ADMIN ONLY */}

//                           {userRole === 'admin' && (

//                             <Button
//                               className="delete-button"
//                               onClick={() =>
//                                 deleteEmployee(
//                                   item.id
//                                 )
//                               }
//                             >
//                               Delete
//                             </Button>

//                           )}

//                         </div>

//                       </DataTable.Cell>

//                     </DataTable.Row>

//                   )
//                 }}

//               </DataTable.TBody>

//             </DataTable.Table>

//           </DataTable.TableContainer>

//         </DataTable.Root>

//       </div>

//     </div>
//   )
// }

// export default App
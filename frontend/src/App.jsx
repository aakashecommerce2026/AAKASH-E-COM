import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MemberManagement from './pages/MemberManagement';
import Commissions from './pages/Commissions';
import RepurchasePanel from './pages/RepurchasePanel';
import PayoutConsole from './pages/PayoutConsole';
import ProfileView from './pages/ProfileView';
import CommissionEngineConsole from './pages/CommissionEngineConsole';
import { fetchMembersRequest, fetchRepurchasesRequest, fetchCommissionsRequest } from './store/actions';


import ResetPassword from './pages/ResetPassword';

function App() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchMembersRequest());
    dispatch(fetchRepurchasesRequest());
    dispatch(fetchCommissionsRequest());
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="*"
        element={
          <Layout>
            <Routes>
              {/* Common Portal Routes */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/profile" element={<ProfileView />} />
              <Route
                path="/commission-engine"
                element={
                  user && user.role === 'Admin' ? (
                    <CommissionEngineConsole />
                  ) : (
                    <Navigate to="/commissions" replace />
                  )
                }
              />
              <Route path="/commissions" element={<Commissions />} />
              <Route path="/repurchase" element={<RepurchasePanel />} />

              {/* Admin or Guarded Routes */}
              <Route
                path="/payouts"
                element={
                  user && user.role === 'Admin' ? (
                    <PayoutConsole />
                  ) : (
                    <PayoutConsole /> // Rendered for both admin & member preview
                  )
                }
              />

              <Route path="/members" element={<MemberManagement />} />

              {/* Fallback Catch-all Route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        }
      />
    </Routes>
  );
}

export default App;


// import React, { useState, useEffect, useCallback } from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import TopNav from './components/TopNav';
// import Sidebar from './components/Sidebar';
// import AlternativeItem from './components/AlternativeItem/AlternativeItem';
// import Footer from './components/Footer';
// import * as apiService from './services/apiService';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import './App.css';
// import AuthPage from './components/Auth/AuthPage';
// import ForgotPassword from './components/Auth/ForgotPassword';
// import AdminPanel from './components/Admin/AdminPanel';

// const App = () => {
//   const [state, setState] = useState({
//     alternatives: [],
//     scoresData: {},
//     alternativesList: [],
//     selectedAlternative: null,
//     selectedTchiAlternative: null,
//     activeSection: 'phuong-an-goi-y',
//     tchiUserAlternatives: [],
//     editingCriterion: null,
//     editingValue: '',
//   });
//   const [isLoading, setIsLoading] = useState(true);
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [uploadError, setUploadError] = useState(null);
//   const [uploadSuccess, setUploadSuccess] = useState(null);
//   const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

//   // Hàm đăng xuất
//   const handleLogout = () => {
//     localStorage.removeItem('token');
//     document.cookie = 'remember_me=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
//     setIsLoggedIn(false); // Cập nhật trạng thái
//     setState((prev) => ({
//       ...prev,
//       tchiUserAlternatives: [], // Xóa danh sách khi đăng xuất
//     }));
//     window.location.href = '/login'; // Chuyển hướng đến trang đăng nhập
//     toast.success('Đăng xuất thành công!');
//   };

//   const handleFileUpload = (event) => {
//     const file = event.target.files[0];
//     if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
//       setSelectedFile(file);
//       setUploadError(null);
//     } else {
//       setSelectedFile(null);
//       setUploadError('Vui lòng chọn file Excel (.xlsx hoặc .xls).');
//     }
//   };

//   const handleUploadClick = async () => {
//     if (!selectedFile || !isLoggedIn) return;

//     try {
//       setUploadError(null);
//       setUploadSuccess(null);
//       await apiService.addTchiUserExcel(selectedFile);
//       setUploadSuccess('File đã được tải lên thành công!');

//       const updatedAlternatives = await apiService.fetchTchiUserAlternatives();
//       setState((prev) => ({
//         ...prev,
//         tchiUserAlternatives: updatedAlternatives || [],
//       }));

//       setSelectedFile(null);
//       toast.success('Dữ liệu đã được cập nhật thành công!');
//     } catch (error) {
//       const errorMessage = error.response?.data?.detail || error.message;
//       setUploadError(`Lỗi khi tải lên file: ${errorMessage}`);
//       toast.error(`Lỗi khi tải lên file: ${errorMessage}`);
//     }
//   };

//   const handleAddTchiAlternative = async () => {
//     if (!isLoggedIn) return;

//     try {
//       const updatedAlternatives = await apiService.fetchTchiUserAlternatives();
//       setState((prev) => ({
//         ...prev,
//         tchiUserAlternatives: updatedAlternatives || [],
//       }));
//       toast.success('Phương án đã được thêm!');
//     } catch (error) {
//       console.error('Error refreshing tchiUserAlternatives:', error);
//       toast.error('Lỗi khi làm mới danh sách phương án.');
//     }
//   };

//   const handleDeleteTchiAlternative = async () => {
//     if (!isLoggedIn) return;

//     try {
//       const updatedAlternatives = await apiService.fetchTchiUserAlternatives();
//       setState((prev) => ({
//         ...prev,
//         tchiUserAlternatives: updatedAlternatives || [],
//       }));
//       toast.success('Phương án đã được xóa!');
//     } catch (error) {
//       console.error('Error refreshing tchiUserAlternatives:', error);
//       toast.error('Lỗi khi làm mới danh sách phương án.');
//     }
//   };

//   const handleScoreSave = async (alternative, isTchiUser, itemId, criterion, value) => {
//     if (!isLoggedIn || !isTchiUser) return;

//     try {
//       const updatedCriterionScores = {
//         ...state.tchiUserAlternatives.find((item) => item.id === itemId).criterion_scores,
//         [criterion]: parseFloat(value) || 0,
//       };

//       const updatedData = {
//         criterion_scores: updatedCriterionScores,
//         final_score: state.tchiUserAlternatives.find((item) => item.id === itemId).final_score,
//       };

//       await apiService.updateTchiUser(itemId, updatedData);

//       const updatedAlternatives = await apiService.fetchTchiUserAlternatives();
//       setState((prev) => ({
//         ...prev,
//         tchiUserAlternatives: updatedAlternatives || [],
//         editingCriterion: null,
//         editingValue: '',
//       }));

//       toast.success(`Điểm tiêu chí cho "${alternative}" đã được cập nhật!`);
//     } catch (error) {
//       console.error('Error updating score:', error);
//       toast.error(`Lỗi khi cập nhật điểm: ${error.message}`);
//     }
//   };

//   const fetchInitialData = useCallback(async () => {
//     if (!isLoggedIn) {
//       setState((prev) => ({
//         ...prev,
//         alternatives: [],
//         tchiUserAlternatives: [],
//       }));
//       setIsLoading(false);
//       return;
//     }

//     try {
//       setIsLoading(true);
//       const ahpData = await apiService.fetchAHPResults();
//       if (ahpData?.length > 0) {
//         setState((prev) => ({
//           ...prev,
//           alternatives: ahpData[0].ranked_alternatives || [],
//           scoresData: ahpData[0].alternative_scores || {},
//           alternativesList: ahpData[0].alternatives_list || [],
//         }));
//       }

//       const tchiData = await apiService.fetchTchiUserAlternatives();
//       setState((prev) => ({ ...prev, tchiUserAlternatives: tchiData || [] }));
//     } catch (error) {
//       console.error('Error fetching initial data:', error);
//       setState((prev) => ({
//         ...prev,
//         alternatives: [],
//         tchiUserAlternatives: [],
//       }));
//       toast.error('Có lỗi khi tải dữ liệu ban đầu.');
//     } finally {
//       setIsLoading(false);
//     }
//   }, [isLoggedIn]);

//   useEffect(() => {
//     fetchInitialData();
//   }, [fetchInitialData]);

//   const handleDetailClick = (alternative) => {
//     setState((prev) => ({
//       ...prev,
//       selectedAlternative: prev.selectedAlternative === alternative ? null : alternative,
//     }));
//   };

//   const handleTchiDetailClick = (alternative) => {
//     setState((prev) => ({
//       ...prev,
//       selectedTchiAlternative: prev.selectedTchiAlternative === alternative ? null : alternative,
//     }));
//   };

//   const handleSectionChange = (section) => {
//     setState((prev) => ({
//       ...prev,
//       activeSection: section,
//       selectedAlternative: null,
//       selectedTchiAlternative: null,
//     }));
//   };

//   const MainContent = () => (
//     <div className="app">
//       <TopNav isLoggedIn={isLoggedIn} onLogout={handleLogout} />
//       <div className="container">
//         <Sidebar activeSection={state.activeSection} onSectionChange={handleSectionChange} />
//         <div className="content">
//           {state.activeSection === 'phuong-an-goi-y' && (
//             <>
//               {isLoading ? (
//                 <div>Đang tải dữ liệu phương án...</div>
//               ) : state.alternatives.length > 0 ? (
//                 state.alternatives.map((item, index) => {
//                   const criterionScores = {};
//                   Object.keys(state.scoresData).forEach((criterion) => {
//                     criterionScores[criterion] = state.scoresData[criterion][index];
//                   });

//                   return (
//                     <AlternativeItem
//                       key={index}
//                       alternative={item.alternative}
//                       score={item.score}
//                       criterionScores={criterionScores}
//                       isSelected={state.selectedAlternative === item.alternative}
//                       onDetailClick={handleDetailClick}
//                       onAddClick={handleAddTchiAlternative}
//                       onDeleteClick={handleDeleteTchiAlternative}
//                       onScoreClick={(criterion, value) => setState((prev) => ({
//                         ...prev,
//                         editingCriterion: criterion,
//                         editingValue: value.toString(),
//                       }))}
//                       onScoreSave={handleScoreSave}
//                       editingCriterion={state.editingCriterion}
//                       editingValue={state.editingValue}
//                       setEditingValue={(value) => setState((prev) => ({ ...prev, editingValue: value }))}
//                     />
//                   );
//                 })
//               ) : (
//                 <div>Không có phương án nào.</div>
//               )}
//             </>
//           )}
//           {state.activeSection === 'tieu-chi-cua-ban' && (
//             <>
//               <h3>Tiêu chí của bạn</h3>
//               <div style={{ marginBottom: '20px' }}>
//                 <label htmlFor="excelFile" style={{ marginRight: '10px' }}>
//                   Chọn file Excel:
//                 </label>
//                 <input
//                   type="file"
//                   id="excelFile"
//                   accept=".xlsx, .xls"
//                   onChange={handleFileUpload}
//                   style={{ marginRight: '10px' }}
//                   disabled={!isLoggedIn}
//                 />
//                 <button
//                   onClick={handleUploadClick}
//                   disabled={!selectedFile || !isLoggedIn}
//                   style={{
//                     padding: '8px 16px',
//                     backgroundColor: selectedFile && isLoggedIn ? '#007bff' : '#ccc',
//                     color: '#fff',
//                     border: 'none',
//                     borderRadius: '4px',
//                     cursor: selectedFile && isLoggedIn ? 'pointer' : 'not-allowed',
//                   }}
//                 >
//                   Tải lên
//                 </button>
//               </div>
//               {uploadError && (
//                 <div style={{ color: 'red', marginBottom: '10px' }}>{uploadError}</div>
//               )}
//               {uploadSuccess && (
//                 <div style={{ color: 'green', marginBottom: '10px' }}>{uploadSuccess}</div>
//               )}
//               {isLoading ? (
//                 <div>Đang tải dữ liệu...</div>
//               ) : state.tchiUserAlternatives.length > 0 ? (
//                 state.tchiUserAlternatives.map((item) => (
//                   <AlternativeItem
//                     key={item.id}
//                     alternative={item.alternative}
//                     score={item.final_score}
//                     criterionScores={item.criterion_scores}
//                     isSelected={state.selectedTchiAlternative === item.alternative}
//                     onDetailClick={handleTchiDetailClick}
//                     onAddClick={handleAddTchiAlternative}
//                     onDeleteClick={handleDeleteTchiAlternative}
//                     onScoreClick={(criterion, value) => setState((prev) => ({
//                       ...prev,
//                       editingCriterion: criterion,
//                       editingValue: value.toString(),
//                     }))}
//                     onScoreSave={handleScoreSave}
//                     editingCriterion={state.editingCriterion}
//                     editingValue={state.editingValue}
//                     setEditingValue={(value) => setState((prev) => ({ ...prev, editingValue: value }))}
//                     isTchiUser
//                     itemId={item.id}
//                     comparisonMatrix={item.criteria_comparison_matrix || []}
//                     consistencyRatio={item.consistency_ratio || 0}
//                     criteriaLabels={item.criteria_list || []}
//                   />
//                 ))
//               ) : (
//                 <div>Chưa có phương án nào.</div>
//               )}
//             </>
//           )}
//           {state.activeSection === 'ca-dat' && (
//             <div>
//               <h3>Cài đặt</h3>
//               <p>Chức năng này chưa được triển khai.</p>
//             </div>
//           )}
//         </div>
//       </div>
//       <Footer />
//     </div>
//   );

//   return (
//     <Router>
//       <Routes>
//         <Route path="*" element={<MainContent />} />
//         <Route path="/login" element={<AuthPage onLogin={() => setIsLoggedIn(true)} />} />
//         <Route path="/register" element={<AuthPage onLogin={() => setIsLoggedIn(true)} />} />
//         <Route path="/forgot-password" element={<ForgotPassword />} />
//         <Route path="/reset-password/:token" element={<ForgotPassword />} />
//         <Route path="/admin" element={<AdminPanel />} />
//       </Routes>
//       <ToastContainer />
//     </Router>
//   );
// };

// export default App;
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import TopNav from './components/TopNav';
import Sidebar from './components/Sidebar';
import AlternativeItem from './components/AlternativeItem/AlternativeItem';
import Footer from './components/Footer';
import * as apiService from './services/apiService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import AuthPage from './components/Auth/AuthPage';
import ForgotPassword from './components/Auth/ForgotPassword';
import AdminPanel from './components/Admin/AdminPanel';
import ResetPassword from './components/Auth/ResetPassword';

const MainContent = ({ isLoggedIn, setIsLoggedIn, state, setState, isLoading, setIsLoading, selectedFile, setSelectedFile, uploadError, setUploadError, uploadSuccess, setUploadSuccess, handleLogout, fetchInitialData }) => {
  const navigate = useNavigate();

  // Check user role and redirect to /admin if role is Admin
  useEffect(() => {
    const checkUserRole = async () => {
      if (isLoggedIn) {
        try {
          const userInfo = await apiService.getCurrentUserInfo();
          if (userInfo.role === 'Admin') {
            navigate('/admin');
          }
        } catch (error) {
          console.error('Error checking user role:', error);
          // If 401, getCurrentUserInfo already handles token removal and redirect to /login
        }
      }
    };
    checkUserRole();
  }, [isLoggedIn, navigate]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setSelectedFile(file);
      setUploadError(null);
    } else {
      setSelectedFile(null);
      setUploadError('Vui lòng chọn file Excel (.xlsx hoặc .xls).');
    }
  };

  const handleUploadClick = async () => {
    if (!selectedFile || !isLoggedIn) return;

    try {
      setUploadError(null);
      setUploadSuccess(null);
      await apiService.addTchiUserExcel(selectedFile);
      setUploadSuccess('File đã được tải lên thành công!');

      const updatedAlternatives = await apiService.fetchTchiUserAlternatives();
      setState((prev) => ({
        ...prev,
        tchiUserAlternatives: updatedAlternatives || [],
      }));

      setSelectedFile(null);
      toast.success('Dữ liệu đã được cập nhật thành công!');
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message;
      setUploadError(`Lỗi khi tải lên file: ${errorMessage}`);
      toast.error(`Lỗi khi tải lên file: ${errorMessage}`);
    }
  };

  const handleAddTchiAlternative = async () => {
    if (!isLoggedIn) return;

    try {
      const updatedAlternatives = await apiService.fetchTchiUserAlternatives();
      setState((prev) => ({
        ...prev,
        tchiUserAlternatives: updatedAlternatives || [],
      }));
      toast.success('Phương án đã được thêm!');
    } catch (error) {
      console.error('Error refreshing tchiUserAlternatives:', error);
      toast.error('Lỗi khi làm mới danh sách phương án.');
    }
  };

  const handleDeleteTchiAlternative = async () => {
    if (!isLoggedIn) return;

    try {
      const updatedAlternatives = await apiService.fetchTchiUserAlternatives();
      setState((prev) => ({
        ...prev,
        tchiUserAlternatives: updatedAlternatives || [],
      }));
      toast.success('Phương án đã được xóa!');
    } catch (error) {
      console.error('Error refreshing tchiUserAlternatives:', error);
      toast.error('Lỗi khi làm mới danh sách phương án.');
    }
  };

  const handleScoreSave = async (alternative, isTchiUser, itemId, criterion, value) => {
    if (!isLoggedIn || !isTchiUser) return;

    try {
      const updatedCriterionScores = {
        ...state.tchiUserAlternatives.find((item) => item.id === itemId).criterion_scores,
        [criterion]: parseFloat(value) || 0,
      };

      const updatedData = {
        criterion_scores: updatedCriterionScores,
        final_score: state.tchiUserAlternatives.find((item) => item.id === itemId).final_score,
      };

      await apiService.updateTchiUser(itemId, updatedData);

      const updatedAlternatives = await apiService.fetchTchiUserAlternatives();
      setState((prev) => ({
        ...prev,
        tchiUserAlternatives: updatedAlternatives || [],
        editingCriterion: null,
        editingValue: '',
      }));

      toast.success(`Điểm tiêu chí cho "${alternative}" đã được cập nhật!`);
    } catch (error) {
      console.error('Error updating score:', error);
      toast.error(`Lỗi khi cập nhật điểm: ${error.message}`);
    }
  };

  const handleDetailClick = (alternative) => {
    setState((prev) => ({
      ...prev,
      selectedAlternative: prev.selectedAlternative === alternative ? null : alternative,
    }));
  };

  const handleTchiDetailClick = (alternative) => {
    setState((prev) => ({
      ...prev,
      selectedTchiAlternative: prev.selectedTchiAlternative === alternative ? null : alternative,
    }));
  };

  const handleSectionChange = (section) => {
    setState((prev) => ({
      ...prev,
      activeSection: section,
      selectedAlternative: null,
      selectedTchiAlternative: null,
    }));
  };

  return (
    <div className="app">
      <TopNav isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      <div className="container">
        <Sidebar activeSection={state.activeSection} onSectionChange={handleSectionChange} />
        <div className="content">
          {state.activeSection === 'phuong-an-goi-y' && (
            <>
              {isLoading ? (
                <div>Đang tải dữ liệu phương án...</div>
              ) : state.alternatives.length > 0 ? (
                state.alternatives.map((item, index) => {
                  const criterionScores = {};
                  Object.keys(state.scoresData).forEach((criterion) => {
                    criterionScores[criterion] = state.scoresData[criterion][index];
                  });

                  return (
                    <AlternativeItem
                      key={index}
                      alternative={item.alternative}
                      score={item.score}
                      criterionScores={criterionScores}
                      isSelected={state.selectedAlternative === item.alternative}
                      onDetailClick={handleDetailClick}
                      onAddClick={handleAddTchiAlternative}
                      onDeleteClick={handleDeleteTchiAlternative}
                      onScoreClick={(criterion, value) => setState((prev) => ({
                        ...prev,
                        editingCriterion: criterion,
                        editingValue: value.toString(),
                      }))}
                      onScoreSave={handleScoreSave}
                      editingCriterion={state.editingCriterion}
                      editingValue={state.editingValue}
                      setEditingValue={(value) => setState((prev) => ({ ...prev, editingValue: value }))}
                    />
                  );
                })
              ) : (
                <div>Không có phương án nào.</div>
              )}
            </>
          )}
          {state.activeSection === 'tieu-chi-cua-ban' && (
            <>
              <h3>Tiêu chí của bạn</h3>
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="excelFile" style={{ marginRight: '10px' }}>
                  Chọn file Excel:
                </label>
                <input
                  type="file"
                  id="excelFile"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  style={{ marginRight: '10px' }}
                  disabled={!isLoggedIn}
                />
                <button
                  onClick={handleUploadClick}
                  disabled={!selectedFile || !isLoggedIn}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: selectedFile && isLoggedIn ? '#007bff' : '#ccc',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: selectedFile && isLoggedIn ? 'pointer' : 'not-allowed',
                  }}
                >
                  Tải lên
                </button>
              </div>
              {uploadError && (
                <div style={{ color: 'red', marginBottom: '10px' }}>{uploadError}</div>
              )}
              {uploadSuccess && (
                <div style={{ color: 'green', marginBottom: '10px' }}>{uploadSuccess}</div>
              )}
              {isLoading ? (
                <div>Đang tải dữ liệu...</div>
              ) : state.tchiUserAlternatives.length > 0 ? (
                state.tchiUserAlternatives.map((item) => (
                  <AlternativeItem
                    key={item.id}
                    alternative={item.alternative}
                    score={item.final_score}
                    criterionScores={item.criterion_scores}
                    isSelected={state.selectedTchiAlternative === item.alternative}
                    onDetailClick={handleTchiDetailClick}
                    onAddClick={handleAddTchiAlternative}
                    onDeleteClick={handleDeleteTchiAlternative}
                    onScoreClick={(criterion, value) => setState((prev) => ({
                      ...prev,
                      editingCriterion: criterion,
                      editingValue: value.toString(),
                    }))}
                    onScoreSave={handleScoreSave}
                    editingCriterion={state.editingCriterion}
                    editingValue={state.editingValue}
                    setEditingValue={(value) => setState((prev) => ({ ...prev, editingValue: value }))}
                    isTchiUser
                    itemId={item.id}
                    comparisonMatrix={item.criteria_comparison_matrix || []}
                    consistencyRatio={item.consistency_ratio || 0}
                    criteriaLabels={item.criteria_list || []}
                  />
                ))
              ) : (
                <div>Chưa có phương án nào.</div>
              )}
            </>
          )}
          {state.activeSection === 'ca-dat' && (
            <div>
              <h3>Cài đặt</h3>
              <p>Chức năng này chưa được triển khai.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

const App = () => {
  const [state, setState] = useState({
    alternatives: [],
    scoresData: {},
    alternativesList: [],
    selectedAlternative: null,
    selectedTchiAlternative: null,
    activeSection: 'phuong-an-goi-y',
    tchiUserAlternatives: [],
    editingCriterion: null,
    editingValue: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  // Hàm đăng xuất
  const handleLogout = () => {
    localStorage.removeItem('token');
    document.cookie = 'remember_me=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setIsLoggedIn(false); // Cập nhật trạng thái
    setState((prev) => ({
      ...prev,
      tchiUserAlternatives: [], // Xóa danh sách khi đăng xuất
    }));
    window.location.href = '/login'; // Chuyển hướng đến trang đăng nhập
    toast.success('Đăng xuất thành công!');
  };

  const fetchInitialData = useCallback(async () => {
    if (!isLoggedIn) {
      setState((prev) => ({
        ...prev,
        alternatives: [],
        tchiUserAlternatives: [],
      }));
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const ahpData = await apiService.fetchAHPResults();
      if (ahpData?.length > 0) {
        setState((prev) => ({
          ...prev,
          alternatives: ahpData[0].ranked_alternatives || [],
          scoresData: ahpData[0].alternative_scores || {},
          alternativesList: ahpData[0].alternatives_list || [],
        }));
      }

      const tchiData = await apiService.fetchTchiUserAlternatives();
      setState((prev) => ({ ...prev, tchiUserAlternatives: tchiData || [] }));
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setState((prev) => ({
        ...prev,
        alternatives: [],
        tchiUserAlternatives: [],
      }));
      toast.error('Có lỗi khi tải dữ liệu ban đầu.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  return (
    <Router>
      <Routes>
        <Route
          path="*"
          element={
            <MainContent
              isLoggedIn={isLoggedIn}
              setIsLoggedIn={setIsLoggedIn}
              state={state}
              setState={setState}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              uploadError={uploadError}
              setUploadError={setUploadError}
              uploadSuccess={uploadSuccess}
              setUploadSuccess={setUploadSuccess}
              handleLogout={handleLogout}
              fetchInitialData={fetchInitialData}
            />
          }
        />
        <Route path="/login" element={<AuthPage onLogin={() => setIsLoggedIn(true)} />} />
        <Route path="/register" element={<AuthPage onLogin={() => setIsLoggedIn(true)} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ForgotPassword />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
      <ToastContainer />
    </Router>
  );
};

export default App;
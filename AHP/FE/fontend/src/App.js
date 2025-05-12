import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TopNav from './components/TopNav';
import Sidebar from './components/Sidebar';
import AlternativeItem from './components/AlternativeItem/AlternativeItem';
import Footer from './components/Footer';
import * as apiService from './services/apiService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

const App = () => {
  const [state, setState] = useState({
    alternatives: [],
    scoresData: {},
    alternativesList: [],
    selectedAlternative: null,
    selectedTchiAlternative: null,
    activeSection: 'phuong-an-goi-y',
    tchiUserAlternatives: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchInitialData = useCallback(async () => {
    try {
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
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

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

  const MainContent = () => (
    <div className="app">
      <TopNav />
      <div className="container">
        <Sidebar activeSection={state.activeSection} onSectionChange={handleSectionChange} />
        <div className="content">
          {state.activeSection === 'phuong-an-goi-y' && (
            <>
              {state.alternatives.length > 0 ? (
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
                      onAddClick={() => {}}
                      onDeleteClick={() => {}}
                      onScoreClick={() => {}}
                      onScoreSave={() => {}}
                      editingCriterion={null}
                      editingValue=""
                      setEditingValue={() => {}}
                    />
                  );
                })
              ) : (
                <div>Đang tải dữ liệu phương án...</div>
              )}
            </>
          )}
          {state.activeSection === 'tieu-chi-cua-ban' && (
            <>
              <h3>Tiêu chí của bạn</h3>
              {state.tchiUserAlternatives.length > 0 ? (
                state.tchiUserAlternatives.map((item) => (
                  <AlternativeItem
                    key={item.id}
                    alternative={item.alternative}
                    score={item.final_score}
                    criterionScores={item.criterion_scores}
                    isSelected={state.selectedTchiAlternative === item.alternative}
                    onDetailClick={handleTchiDetailClick}
                    onAddClick={() => {}}
                    onDeleteClick={() => {}}
                    onScoreClick={() => {}}
                    onScoreSave={() => {}}
                    editingCriterion={null}
                    editingValue=""
                    setEditingValue={() => {}}
                    isTchiUser
                    itemId={item.id}
                    comparisonMatrix={item.criteria_comparison_matrix || []}
                    consistencyRatio={item.consistency_ratio || 0}
                    criteriaLabels={item.criteria_list || []}
                  />
                ))
              ) : (
                <div>Chưa có phương án nào được chọn.</div>
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

  return (
    <Router>
      <Routes>
        <Route path="*" element={<MainContent />} />
      </Routes>
      <ToastContainer />
    </Router>
  );
};

export default App;
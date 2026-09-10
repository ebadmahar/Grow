import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ApiResponse, MonthlyGoalData } from '../types/api';

export const goalApi = {
  getMonthlyGoal: async () => {
    try {
      const goalsSnap = await getDoc(doc(db, 'config', 'goals'));
      let treesPlanted = 6420;
      let targetTrees = 10000;
      let targetSeeds = 50000;

      if (goalsSnap.exists()) {
        const d = goalsSnap.data();
        treesPlanted = Number(d.treesCurrent || 6420);
        targetTrees = Number(d.treeTarget || 10000);
        targetSeeds = Number(d.seedTarget || 50000);
      }

      const percent = Math.min(Math.round((treesPlanted / targetTrees) * 100), 100);

      const response: ApiResponse<MonthlyGoalData> = {
        success: true,
        data: {
          title: 'September 2026 Islamabad Green Cover Initiative',
          period: 'September 2026',
          completion_percentage: percent,
          trees_planted: treesPlanted,
          target_trees: targetTrees,
          target_seeds: targetSeeds,
          target_participants: 250,
          sub_goals: [
            { name: 'Margalla Ridge Core', current: 3840, target: 5000, percentage: 76 },
            { name: 'Shakarparian Buffer', current: 1420, target: 2000, percentage: 71 },
            { name: 'Rawal Catchment', current: 890, target: 1500, percentage: 59 },
          ],
        },
      };
      return response;
    } catch (e) {
      return {
        success: true,
        data: {
          title: 'September 2026 Islamabad Green Cover Initiative',
          period: 'September 2026',
          completion_percentage: 64,
          trees_planted: 6420,
          target_trees: 10000,
          target_seeds: 50000,
          target_participants: 250,
          sub_goals: [
            { name: 'Margalla Ridge Core', current: 3840, target: 5000, percentage: 76 },
            { name: 'Shakarparian Buffer', current: 1420, target: 2000, percentage: 71 },
          ],
        },
      };
    }
  },
};

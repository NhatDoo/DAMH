import { useEffect } from 'react';
import neo4j from 'neo4j-driver';

const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'Nhat123456789'));

const useNeo4j = ({ criteriaLabels, editableMatrix, alternativesList, alternativeMatrix, rankedResults, itemId }) => {
  useEffect(() => {
    return () => {
      driver.close();
    };
  }, []);

  const saveToNeo4j = async () => {
    let session;
    let tx;
    try {
      session = driver.session({ database: 'neo4j' });
      tx = session.beginTransaction();

      await tx.run('MATCH (c:Criterion)-[r:COMPARES]->(d:Criterion) DELETE r');
      await tx.run('MATCH (c:Criterion) DETACH DELETE c');
      await tx.run('MATCH (a:Alternative)-[r:COMPARES]->(b:Alternative) DELETE r');
      await tx.run('MATCH (a:Alternative) DETACH DELETE a');
      await tx.run('MATCH (e:Evaluation) DETACH DELETE e');

      await tx.run(
        'UNWIND $criteria AS criterion MERGE (c:Criterion {name: criterion})',
        { criteria: criteriaLabels }
      );
      const sizeCriteria = criteriaLabels.length;
      for (let i = 0; i < sizeCriteria; i++) {
        for (let j = 0; j < sizeCriteria; j++) {
          if (i < j && editableMatrix[i][j] !== '') {
            await tx.run(
              'MATCH (c1:Criterion {name: $name1}), (c2:Criterion {name: $name2}) ' +
              'MERGE (c1)-[r:COMPARES {value: $value}]->(c2)',
              {
                name1: criteriaLabels[i],
                name2: criteriaLabels[j],
                value: editableMatrix[i][j],
              }
            );
          }
        }
      }

      await tx.run(
        'UNWIND $alternatives AS alt MERGE (a:Alternative {name: alt})',
        { alternatives: alternativesList }
      );
      const sizeAlternatives = alternativesList.length;
      for (let i = 0; i < sizeAlternatives; i++) {
        for (let j = 0; j < sizeAlternatives; j++) {
          if (i < j && alternativeMatrix[i][j] !== '') {
            await tx.run(
              'MATCH (a1:Alternative {name: $name1}), (a2:Alternative {name: $name2}) ' +
              'MERGE (a1)-[r:COMPARES {value: $value}]->(a2)',
              {
                name1: alternativesList[i],
                name2: alternativesList[j],
                value: alternativeMatrix[i][j],
              }
            );
          }
        }
      }

      if (rankedResults) {
        await tx.run(
          'MERGE (e:Evaluation {itemId: $itemId})',
          { itemId }
        );
        for (const [idx, item] of rankedResults.alternatives.entries()) {
          await tx.run(
            'MATCH (e:Evaluation {itemId: $itemId}), (a:Alternative {name: $name}) ' +
            'MERGE (e)-[r:HAS_RESULT {rank: $rank, score: $score}]->(a)',
            {
              itemId,
              name: item.alternative,
              rank: idx + 1,
              score: item.score,
            }
          );
        }
      }

      await tx.commit();
      alert('Dữ liệu đã được lưu vào Neo4j thành công!');
    } catch (error) {
      if (tx) await tx.rollback();
      console.error('Error saving to Neo4j:', error);
      alert(`Có lỗi khi lưu vào Neo4j: ${error.message}`);
    } finally {
      if (session) await session.close();
    }
  };

  return { saveToNeo4j };
};

export default useNeo4j;
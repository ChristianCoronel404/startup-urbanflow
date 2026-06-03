const neo4j = require('neo4j-driver');
const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
const user = process.env.NEO4J_USER || 'neo4j';
const password = process.env.NEO4J_PASSWORD || 'urbanflow';
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

async function populate() {
  const session = driver.session();
  await session.run('CREATE CONSTRAINT IF NOT EXISTS FOR (s:Stop) REQUIRE s.id IS UNIQUE');
  await session.run(`MERGE (c:Stop {id:'stopA', name:'Centro', mode:'walk', lat:4.60, lng:-74.08})
MERGE (b:Stop {id:'stopB', name:'Parque', mode:'bus', lat:4.61, lng:-74.07})
MERGE (d:Stop {id:'stopC', name:'Estacion', mode:'train', lat:4.62, lng:-74.06})
MERGE (e:Stop {id:'stopD', name:'Aeropuerto', mode:'bus', lat:4.64, lng:-74.05})
MERGE (s1:Stop {id:'stop1', name:'Puerta Norte', mode:'scooter', lat:4.605, lng:-74.075})
MERGE (c)-[:CONNECTS_TO {duration:5, cost:0, co2:0.05}]->(b)
MERGE (b)-[:CONNECTS_TO {duration:8, cost:1.2, co2:0.3}]->(d)
MERGE (d)-[:CONNECTS_TO {duration:12, cost:2.5, co2:0.8}]->(e)
MERGE (c)-[:CONNECTS_TO {duration:10, cost:0.5, co2:0.1, mode:'scooter'}]->(s1)
MERGE (s1)-[:CONNECTS_TO {duration:10, cost:0.7, co2:0.2, mode:'walk'}]->(e)`);
  console.log('Neo4j data poblada.');
  await session.close();
  await driver.close();
}

populate().catch((err) => {
  console.error(err);
  process.exit(1);
});
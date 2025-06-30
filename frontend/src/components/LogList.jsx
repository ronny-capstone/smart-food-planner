import LogModal from "./LogModal";
import LogForm from "./LogForm";
import { useEffect, useState } from "react";

export default function LogList() {
  const [logs, setLogs] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:3000/log/`)
      .then((response) => response.json())
      .then((data) => {
        setLogs(data);
      })
      .catch((err) => {
        console.log(err.message);
      });
  }, []);

  const handleLogAdded = (createdLog) => {
    setLogs([createdLog, ...logs]);
    setShowModal(false);
  };

  return (
    <div>
      <div className="logList">
        {logs.map((log) => {
          return (
            <div className="logCard" key={log.id}>
              <h3 className="log-title"> Log for {log.date_logged} </h3>
              <p className="log-item"> Food item: {log.item_id} </p>
              <p className="log-servings"> Servings: {log.servings} </p>
            </div>
          );
        })}
      </div>

      <button onClick={() => setShowModal(true)}> Add new log </button>
      {showModal && (
        <LogModal onClose={() => setShowModal(false)}>
          {" "}
          <LogForm onAddLog={handleLogAdded} setShowModal={setShowModal} />{" "}
        </LogModal>
      )}
    </div>
  );
}

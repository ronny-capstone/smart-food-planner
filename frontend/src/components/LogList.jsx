import LogModal from "./LogModal";
import LogForm from "./LogForm";
import { API_BASE_URL } from "../utils/api";
import { useEffect, useState } from "react";

export default function LogList() {
  const [logs, setLogs] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/log`)
      .then((response) => response.json())
      .then((data) => {
        setLogs(data);
      })
      .catch((err) => {
        console.log(err.message);
      });
  }, [setLogs]);

  const handleLogAdded = (createdLog) => {
    setLogs((prevLogs) => [createdLog.log, ...prevLogs]);
    setShowModal(false);
  };

  const handleDelete = async (logToDelete) => {
    try {
      await fetch(`${API_BASE_URL}/log/${logToDelete.id}`, {
        method: "DELETE",
      })
        .then((response) => {
          if (response.status === 200) {
            setLogs(
              logs.filter(function (log) {
                return log !== logToDelete;
              })
            );
          }
        })
        .catch((err) => {
          console.log("Failed to delete log:", err);
        });
    } catch (err) {
      console.log("Failed to delete log:", err.message);
    }
  };

  const formatDateString = (dateString) => {
    const [year, month, day] = dateString.split("-");
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div>
      <button onClick={() => setShowModal(true)}> Add new log </button>
      {showModal && (
        <LogModal onClose={() => setShowModal(false)}>
          {" "}
          <LogForm
            handleLogAdded={handleLogAdded}
            setShowModal={setShowModal}
            type="add"
          />{" "}
        </LogModal>
      )}
      <div className="logList">
        {logs.length == 0 && <p> No logs yet! </p>}
        {/* Sorted by most recently added  */}
        {logs
          .sort((a, b) => b.id - a.id)
          .map((log) => {
            return (
              <div className="logCard" key={log.id}>
                <h3 className="log-title">
                  {" "}
                  Log for {formatDateString(log.date_logged)}{" "}
                </h3>
                <p className="log-item"> Food item: {log.item_id} </p>
                <p className="log-servings"> Servings: {log.servings} </p>
                <button onClick={() => setShowModal(true)}> Update </button>
                {showModal && (
                  <LogModal onClose={() => setShowModal(false)}>
                    {" "}
                    <LogForm
                      handleLogAdded={handleLogAdded}
                      setShowModal={setShowModal}
                      type="update"
                    />{" "}
                  </LogModal>
                )}
                <button onClick={() => handleDelete(log)}> Delete </button>
              </div>
            );
          })}
      </div>
    </div>
  );
}

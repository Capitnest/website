import React, { useEffect, useState, useRef } from "react";
import Navbarr from "./Navbar/Navbarr";
import {
  Container,
  Alert,
  Card,
  FormControl,
  Form,
  Button,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { auth, database } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import {
  loadCaptchaEnginge,
  LoadCanvasTemplate,
  LoadCanvasTemplateNoReload,
  validateCaptcha,
} from "react-simple-captcha";

export default function Wallet() {
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [money, setMoney] = useState(0.0); //the balance from the database
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState(0.0);
  const coins = useRef(0); //the coins that the user wants to send
  const id = useRef("");
  const captcha = useRef("");
  const [username, setUsername] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    //checks if the captcha is correct
    if (validateCaptcha(captcha.current.value) === true) {
      loadCaptchaEnginge(6);
      setError("");
    } else {
      setDone("");
      return setError("Incorrect Captcha!");
    }

    //check if the user has enough money to send coins to a user
    if (coins.current.value > money) {
      return setError("You don't have that many coins!");
    }

    //checks if the wallet id is valid or not
    try {
      //checks if the wallet that the coins will be send is the sender wallet
      if (auth.currentUser.uid == id.current.value) {
        return setError("You can't send money to your own wallet!");
      } else if (auth.currentUser !== null) {
        var run = false;
        var data;
        database
          .ref("users/" + id.current.value + "/balance")
          .on("value", (snapshot) => {
            //how much coins the receiver has in the balance
            data = parseFloat(snapshot.val());

            //if the data === null that means that the values doesn't exists
            //in the database, so the user doesn't exists / is invalid
            if (data === null) {
              return setError("The Wallet Id is invalid!");
            } else {
              run = true;
              database
                .ref("users/" + id.current.value + "/username")
                .on("value", (snapshot) => {
                  const data = snapshot.val();
                  setUsername(data);
                });
            }
          });

        if (run === true) {
          //change the database values for the user that receives the coins
          database.ref("users/" + id.current.value).set({
            username: username,
            balance: parseFloat(data + parseFloat(coins.current.value)),
          });

          //change the database values for the user that send the coins
          database.ref("users/" + auth.currentUser.uid).set({
            username: "Timnik",
            balance: parseFloat(money - parseFloat(coins.current.value)),
          });

          setMoney(money - parseFloat(coins.current.value));

          return setDone("Transaction Completed!");
        } else {
          setDone(
            "Are you sure you want to send the coins to this wallet?\n Complete the form once more if you are sure"
          );
        }
      }
    } catch {
      setError("The Wallet Id is invalid!");
    }

    // try {
    //   setError("");
    //   setLoading(true);
    //   await signup(emailRef.current.value, passwordRef.current.value);

    //   database.ref("users/" + auth.currentUser.uid).set({
    //     username: usernameRef.current.value,
    //     email: emailRef.current.value,
    //     balance: 0,
    //   });
    // } catch {
    //   setError("Failed to create an account");
    // }

    setLoading(false);
  }

  useEffect(() => {
    if (auth.currentUser !== null) {
      database
        .ref("users/" + auth.currentUser.uid + "/balance")
        .on("value", (snapshot) => {
          const data = snapshot.val();
          setMoney(data);
        });
    }
    loadCaptchaEnginge(6);
  }, []);

  return (
    <>
      <Navbarr />

      <Container
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: "100vh" }}
      >
        <div className="w-100" style={{ maxWidth: "400px" }}>
          <div style={{ textAlign: "center" }}>
            <h1>Your Wallet:</h1>
            <p>
              <b>{money}</b> Atomic Coins
            </p>
          </div>

          <Card>
            <Card.Body>
              <h2 className="text-center mb-4">Send Coins to a Wallet</h2>
              {error && <Alert variant="danger">{error}</Alert>}
              {done && <Alert variant="success">{done}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group id="email">
                  <Form.Label>Wallet Id</Form.Label>
                  <Form.Control ref={id} required />
                </Form.Group>
                <Form.Group id="email">
                  <Form.Label>Amount of Coins</Form.Label>
                  <Form.Control ref={coins} required />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Captcha</Form.Label>
                  <div className="form-group">
                    <div className="col mt-3">
                      <LoadCanvasTemplate />
                    </div>

                    <Form.Control ref={captcha} required />
                  </div>
                </Form.Group>
                <Button disabled={loading} className="w-100" type="submit">
                  Send Coins
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </div>
      </Container>
    </>
  );
}

use aleo::{cli::Command, commands::parse};

#[test]
fn test_new() {
    for _ in 0..3 {
        assert!(parse(Command::New { seed: None }).is_ok());
    }
}

#[test]
fn test_new_seeded() {
    let seed = Some(1231275789u64);
    let expected = r"
  Private Key  APrivateKey1tvv5YV1dipNiku2My8jMkqpqCyYKvR5Jq4y2mtjw7s77Zpn
     View Key  AViewKey1m8gvywHKHKfUzZiLiLoHedcdHEjKwo5TWo6efz8gK7wF
      Address  aleo1faksgtpmculyzt6tgaq26fe4fgdjtwualyljjvfn2q6k42ydegzspfz9uh
";

    let actual = parse(Command::New { seed }).unwrap();
    assert_eq!(expected, actual);
}

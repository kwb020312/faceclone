var express = require('express');
var mysql = require('mysql');
var router = express.Router();
var connection = mysql.createConnection({
  host : 'localhost',
  user : 'root',
  password : '111111',
  port : '3306',
  database : 'faceclone'
});
// 좋아요 누른사람의 배열
var like_array = [];

connection.connect();

/* GET home page. */
router.get('/', function(req, res, next) {
  // 회원목록 가져오기
  
  connection.query('SELECT * FROM faceclone_recent_login ORDER BY date DESC LIMIT 3;',(err , rows , fields) => {
    if(!err) {
      res.render('login',{users:rows});
    } else {
      console.log(err);
    }
  })
});

router.post('/login',(req,res) => {
  // 로그인처리
  connection.query(`SELECT c.post_id , c.user_name, c.user_comment , c.user_date FROM  faceclone_comment AS c  LEFT JOIN faceclone_post AS p ON p.id = c.post_id;`,(error , row2 , field2) => {
    connection.query(`SELECT * FROM faceclone_post ORDER BY id desc;`,(error , row1 , field1) => {
      connection.query(`SELECT * FROM faceclone_users WHERE phone_or_email = '${req.body.user_name}' AND pw = '${req.body.user_pw}';`,(err , rows, fields) => {
        if(!req.session.user_session_id) {
          if(rows.length > 0) {
            req.session.user_session_id = rows[0].phone_or_email;
            connection.query(`INSERT INTO faceclone_recent_login(name,recent_id,gender) VALUES ('${rows[0].first_name}${rows[0].last_name}','${rows[0].id}','${rows[0].gender}');`,(err , rows, fields) => {
              if(err) {
                return;
              }
            });
          
            res.render('home',{user:rows,post:row1,comment:row2});} else {
            res.render('location');
          }
        } else {
          res.render('home',{user:rows,post:row1,comment:row2});
        }
      })
    })
  });
})

router.get('/login',(req, res) => {
  connection.query(`SELECT c.post_id , c.user_name, c.user_comment , c.user_date FROM  faceclone_comment AS c  LEFT JOIN faceclone_post AS p ON p.id = c.post_id;`,(error , row2 , field2) => {
    
    connection.query(`SELECT * FROM faceclone_post ORDER BY id desc;`,(error , row1 , field1) => {
      connection.query(`SELECT * FROM faceclone_users WHERE phone_or_email = '${req.session.user_session_id}';`,(err , rows, fields) => {
        // 첫 로그인 외에 로그인이 되었을 때
        res.render('home',{user:rows,post:row1,comment:row2});
      });
    });
  });
});

router.post('/register',(req,res) => {
  // 회원가입 처리
  connection.query(`INSERT INTO faceclone_users(first_name,last_name,phone_or_email,pw,birth_year,birth_month,birth_day,gender) VALUES ('${req.body.first_name}','${req.body.last_name}','${req.body.phone_or_email}','${req.body.pw}','${req.body.birth_year}','${req.body.birth_month}','${req.body.birth_day}','${req.body.gender}');`,(err , rows , fields) => {
    if(!err) {
      console.log('회원정보 등록 완료');
      res.render('location');
    } else {
      console.log(err);
    }
  })
})

// 게시글 입력 처리
router.post('/posting',(req,res) => {
  connection.query(`INSERT INTO faceclone_post(user_name,description) VALUES ('${req.body.faceclone_user_name}','${req.body.desc}');`,(err , rows , fields) => {
    if(!err) {
      res.redirect('/login');
    }
  });
})

// 게시글 좋아요 처리
router.post('/like',(req,res) => {
  connection.query(`UPDATE faceclone_post SET like_count = like_count + 1 WHERE id = ${req.body.posting_num};`,(err , rows , fields) => {
    console.log('좋아요 눌러줌');
  });
  // // 그 사람이 해당 배열에 있는가? 없다면,
  // if(like_array.includes(req.session.user_session_id) === false) {
  //   // 배열에 추가하고,
  //   like_array.push(req.session.user_session_id);
  //   // 쿼리문으로 좋아요 추가
  //   connection.query(`UPDATE faceclone_post SET like_count = like_count + 1 WHERE id = ${req.body.posting_num};`,(err , rows , fields) => {
  //     console.log('좋아요 눌러줌');
  //   });
  //   // 그 사람이 배열에 있다면,
  // } else {
  //   // 좋아요 누른사람의 배열번째를 찾아내고,
  //   var how_index = like_array.indexOf(req.session.user_session_id);
  //   // 제거 한 후에,
  //   like_array.remove(how_index,1);
  //   // 쿼리문으로 좋아요 제거
  //   connection.query(`UPDATE faceclone_post SET like_count = like_count - 1 WHERE id = ${req.body.posting_num};`,(err , rows , fields) => {
  //     console.log('좋아요 해제됨');
  //   });
  // }
  console.log(like_array);
})

// 게시글 좋아요 취소 처리
router.post('/unlike',(req,res) => {
  connection.query(`UPDATE faceclone_post SET like_count = like_count - 1 WHERE id = ${req.body.posting_num};`,(err , rows , fields) => {
    console.log('좋아요 취소 눌러줌');
  });
})

module.exports = router;
